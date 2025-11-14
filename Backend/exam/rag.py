from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from auth.models import SubjectMaterials
from main.config import Settings


async def get_subject_materials(db: AsyncSession, subject: str) -> str:
    """
    Получает материалы по предмету из базы данных

    Args:
        db: Сессия базы данных
        subject: Название предмета

    Returns:
        str: Контекст материалов
    """
    result = await db.execute(
        select(SubjectMaterials).where(SubjectMaterials.subject == subject)
    )
    materials = result.scalars().all()

    if not materials:
        return ""

    context = "\n\n".join([m.content for m in materials])
    return context


async def save_subject_materials(db: AsyncSession, subject: str, content: str):
    """
    Сохраняет материалы по предмету в базу данных

    Args:
        db: Сессия базы данных
        subject: Название предмета
        content: Содержание материалов
    """
    material = SubjectMaterials(subject=subject, content=content)
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return material


async def build_rag_context(
    db: AsyncSession,
    subject: str,
    additional_materials: Optional[List[str]] = None
) -> str:
    """
    Строит контекст для RAG из материалов по предмету

    Args:
        db: Сессия базы данных
        subject: Название предмета
        additional_materials: Дополнительные материалы (если переданы при старте экзамена)

    Returns:
        str: Контекст для использования в промптах
    """
    # Получаем материалы из БД
    db_materials = await get_subject_materials(db, subject)

    # Объединяем с дополнительными материалами
    all_materials = []
    if db_materials:
        all_materials.append(db_materials)

    if additional_materials:
        all_materials.extend(additional_materials)

    # Если есть новые материалы, сохраняем их в БД
    if additional_materials and len(additional_materials) > 0:
        for material in additional_materials:
            if material and material.strip():  # Проверяем, что материал не пустой
                await save_subject_materials(db, subject, material)

    return "\n\n---\n\n".join(all_materials) if all_materials else ""
