from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from auth.models import SubjectMaterials
from main.config import Settings
from exam.qdrant_service import qdrant_service


async def get_subject_materials(db: AsyncSession, subject: str, query: Optional[str] = None) -> str:
    try:
        materials = qdrant_service.get_subject_materials(
            subject, query=query, limit=10)
        if materials:
            return materials
    except Exception as e:
        print(f"Error getting materials from Qdrant: {e}")
        pass

    result = await db.execute(
        select(SubjectMaterials).where(SubjectMaterials.subject == subject)
    )
    materials = result.scalars().all()

    if not materials:
        return ""

    context = "\n\n".join([m.content for m in materials])
    return context


async def save_subject_materials(db: AsyncSession, subject: str, content: str):
    try:
        qdrant_service.add_document(
            subject=subject,
            content=content,
            metadata={"source": "text_upload"}
        )
    except Exception as e:
        print(f"Error saving to Qdrant: {e}")

    material = SubjectMaterials(subject=subject, content=content)
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return material


async def save_pdf_to_qdrant(
    subject: str,
    pdf_pages: List[str],
    metadata: Optional[dict] = None
) -> List[str]:
    from exam.pdf_parser import split_text_into_chunks
    import uuid

    document_ids = []

    for page_num, page_text in enumerate(pdf_pages):
        chunks = split_text_into_chunks(
            page_text, chunk_size=1000, overlap=200)

        for chunk_num, chunk in enumerate(chunks):
            chunk_metadata = {
                "source": "pdf",
                "page": page_num + 1,
                "chunk": chunk_num + 1,
                **(metadata or {})
            }

            document_id = qdrant_service.add_document(
                subject=subject,
                content=chunk,
                document_id=str(uuid.uuid4()),
                metadata=chunk_metadata
            )
            document_ids.append(document_id)

    return document_ids


async def build_rag_context(
    db: AsyncSession,
    subject: str,
    additional_materials: Optional[List[str]] = None,
    query: Optional[str] = None
) -> str:
    qdrant_materials = await get_subject_materials(db, subject, query=query)

    all_materials = []
    if qdrant_materials:
        all_materials.append(qdrant_materials)

    if additional_materials:
        all_materials.extend(additional_materials)

    if additional_materials and len(additional_materials) > 0:
        for material in additional_materials:
            if material and material.strip():
                await save_subject_materials(db, subject, material)

    return "\n\n---\n\n".join(all_materials) if all_materials else ""
