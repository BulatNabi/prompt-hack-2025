import { useEffect, useRef, useState } from 'react';

type VisualizationState = 'waiting' | 'thinking' | 'evaluating' | 'speaking' | 'happy' | 'sad';

interface TeacherVisualizationProps {
    state: VisualizationState;
}

export default function TeacherVisualization({ state }: TeacherVisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const neuronsRef = useRef<SVGGElement>(null);
    const wavesRef = useRef<SVGGElement>(null);
    const particlesRef = useRef<SVGGElement>(null);

    const animationFrameRef = useRef<number | undefined>(undefined);
    const [, setTime] = useState(0);

    const [, setWaveObjs] = useState<Array<{ el: SVGCircleElement; r: number; phase: number }>>([]);
    const [, setParticleObjs] = useState<Array<{ el: SVGCircleElement; angle: number; radius: number; speed: number; life: number }>>([]);
    const [, setNeuronObjs] = useState<Array<{ el: SVGGElement; age: number; maxAge: number }>>([]);

    const colors = {
        waiting: '#6366f1',
        thinking: '#f59e0b',
        evaluating: '#ef4444',
        speaking: '#10b981',
        happy: '#34d399',
        sad: '#f87171',
    };

    const stateConfig = {
        waiting: { waves: 2, particles: 4, neurons: 3 },
        thinking: { waves: 4, particles: 10, neurons: 8 },
        evaluating: { waves: 6, particles: 14, neurons: 12 },
        speaking: { waves: 5, particles: 12, neurons: 6 },
        happy: { waves: 7, particles: 16, neurons: 10 },
        sad: { waves: 3, particles: 6, neurons: 4 },
    };

    const createNeuron = (): { el: SVGGElement; age: number; maxAge: number } => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = angle1 + Math.PI * 0.5 + (Math.random() - 0.5) * 0.6;
        const r1 = 45 + Math.random() * 35;
        const r2 = 45 + Math.random() * 35;
        const d = `M ${145 + Math.cos(angle1) * r1} ${145 + Math.sin(angle1) * r1} Q ${145 + Math.cos((angle1 + angle2) / 2) * 60} ${145 + Math.sin((angle1 + angle2) / 2) * 60} ${145 + Math.cos(angle2) * r2} ${145 + Math.sin(angle2) * r2}`;
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', String(1.2 + Math.random() * 0.8));
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', String(0.4 + Math.random() * 0.4));
        g.appendChild(path);
        if (neuronsRef.current) neuronsRef.current.appendChild(g);
        return { el: g, age: 0, maxAge: 50 + Math.random() * 70 };
    };

    const createWave = (baseR: number): { el: SVGCircleElement; r: number; phase: number } => {
        const wave = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        wave.setAttribute('cx', '145');
        wave.setAttribute('cy', '145');
        wave.setAttribute('fill', 'none');
        wave.setAttribute('stroke', colors[state]);
        wave.setAttribute('stroke-width', '2.5');
        wave.setAttribute('opacity', '0.7');
        if (wavesRef.current) wavesRef.current.appendChild(wave);
        return { el: wave, r: baseR, phase: Math.random() * Math.PI * 2 };
    };

    const createParticle = (): { el: SVGCircleElement; angle: number; radius: number; speed: number; life: number } => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        p.setAttribute('r', String(1.2 + Math.random() * 1.8));
        p.setAttribute('fill', 'white');
        p.setAttribute('opacity', '0');
        if (particlesRef.current) particlesRef.current.appendChild(p);
        return { el: p, angle: Math.random() * Math.PI * 2, radius: 85 + Math.random() * 55, speed: 0.7 + Math.random() * 1.5, life: 1 };
    };

    useEffect(() => {
        const config = stateConfig[state] || stateConfig.waiting;

        const newWaves = Array.from({ length: config.waves }, (_, i) => createWave(95 + i * 11));
        setWaveObjs(newWaves);

        const newParticles = Array.from({ length: config.particles }, () => createParticle());
        setParticleObjs(newParticles);

        const newNeurons = Array.from({ length: config.neurons }, () => createNeuron());
        setNeuronObjs(newNeurons);

        return () => {
            [wavesRef, particlesRef, neuronsRef].forEach(ref => {
                if (ref.current) ref.current.innerHTML = '';
            });
        };
    }, [state]);

    useEffect(() => {
        let animationTime = 0;
        const animate = () => {
            animationTime += 0.016;
            setTime(animationTime);

            setNeuronObjs(prev => prev
                .map(n => {
                    n.age++;
                    if (n.age > n.maxAge) {
                        n.el.remove();
                        return null;
                    }
                    n.el.style.opacity = String(0.4 + 0.4 * (1 - n.age / n.maxAge));
                    return n;
                })
                .filter((n): n is NonNullable<typeof n> => n !== null)
            );

            setWaveObjs(prev => {
                prev.forEach((w, i) => {
                    let r = w.r;
                    if (state === 'speaking') r += Math.sin(animationTime * 8 + i * 0.5) * 12;
                    else if (state === 'evaluating') r += Math.sin(animationTime * 6 + i) * 18;
                    else if (state === 'thinking') r += Math.random() * 10;
                    else r += Math.sin(animationTime * 1.3 + i) * 5;

                    w.el.setAttribute('r', String(r));
                    w.el.setAttribute('opacity', String(0.75 / (1 + r / 110)));
                    w.el.setAttribute('stroke', colors[state]);
                });
                return prev;
            });

            setParticleObjs(prev => {
                prev.forEach(p => {
                    p.angle += p.speed * 0.01 * (state === 'speaking' ? 2.5 : 1);
                    const x = 145 + Math.cos(p.angle) * p.radius;
                    const y = 145 + Math.sin(p.angle) * p.radius * 0.7;
                    p.el.setAttribute('cx', String(x));
                    p.el.setAttribute('cy', String(y));
                    p.el.setAttribute('opacity', String(p.life));
                    p.life *= 0.97;
                    if (p.life < 0.1) p.life = 1;
                });
                return prev;
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [state]);

    const currentColor = colors[state];

    return (
        <div className="relative w-full flex justify-center mb-6">
            <div className="relative w-[390px] h-[310px]">
                <svg ref={svgRef} width="290" height="290" viewBox="0 0 290 290" className="w-full h-full">
                    <defs>
                        <radialGradient id="core-grad">
                            <stop offset="0%" stopColor={currentColor} stopOpacity="1" />
                            <stop offset="65%" stopColor={currentColor} stopOpacity="0.75" />
                            <stop offset="100%" stopColor={currentColor} stopOpacity="0.2" />
                        </radialGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="22" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="inner-glow">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="9" />
                        </filter>
                    </defs>

                    <g className="orbits">
                        <circle cx="145" cy="145" r="135" fill="none" stroke={currentColor} strokeWidth="1" opacity="0.25" />
                        <circle cx="145" cy="145" r="115" fill="none" stroke={currentColor} strokeWidth="1.4" opacity="0.45" />
                    </g>

                    <g
                        className={`core ${state}`}
                        style={{
                            animation:
                                state === 'waiting' ? 'wait-chaos 4.5s ease-in-out infinite' :
                                    state === 'thinking' ? 'think-neural 2.8s ease-in-out infinite' :
                                        state === 'evaluating' ? 'eval-shockwave 2s ease-in-out infinite' :
                                            state === 'speaking' ? 'speak-flow 1.5s ease-in-out infinite' :
                                                state === 'happy' ? 'happy-bloom 2s ease-in-out infinite' :
                                                    state === 'sad' ? 'sad-collapse 2.2s ease-in-out infinite' : 'none',
                        }}
                    >
                        <circle cx="145" cy="145" r="78" fill="url(#core-grad)" filter="url(#glow)" />
                        <circle cx="145" cy="145" r="78" fill="none" stroke={currentColor} strokeWidth="4" filter="url(#inner-glow)" />
                        <g ref={neuronsRef} id="neurons" />
                    </g>

                    <g ref={wavesRef} className="waves" id="waves" />
                    <g ref={particlesRef} className="particles" id="particles" />
                </svg>
            </div>

            <style>{`
        @keyframes wait-chaos {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.03) rotate(1.5deg); }
          50% { transform: scale(1.01) rotate(-1deg); }
          75% { transform: scale(1.04) rotate(0.8deg); }
        }
        @keyframes think-neural {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.07) rotate(3deg); }
          40% { transform: scale(1.04) rotate(-2deg); }
          60% { transform: scale(1.09) rotate(4deg); }
          80% { transform: scale(1.05) rotate(-1deg); }
        }
        @keyframes eval-shockwave {
          0%, 100% { transform: scale(1); }
          15%, 45%, 75% { transform: scale(1.07); }
          30%, 60% { transform: scale(1.03); }
        }
        @keyframes speak-flow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes happy-bloom {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.12); filter: brightness(1.8); }
        }
        @keyframes sad-collapse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(0.92); filter: brightness(0.7); }
        }
      `}</style>
        </div>
    );
}