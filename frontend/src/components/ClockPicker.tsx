"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './ClockPicker.module.css';

interface ClockPickerProps {
    value: string; // HH:mm format (24h)
    onChange: (value: string) => void;
}

export default function ClockPicker({ value, onChange }: ClockPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const clockRef = useRef<SVGSVGElement>(null);
    const [isDragging, setIsDragging] = useState<'hour' | 'minute' | null>(null);

    const [h24, m24] = value.split(':');
    const hour24 = parseInt(h24);
    const minute = parseInt(m24);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsDragging(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleUpdate = (h: number, m: number, p: string) => {
        let finalH = h;
        if (p === 'PM' && h < 12) finalH += 12;
        if (p === 'AM' && h === 12) finalH = 0;

        const hStr = finalH.toString().padStart(2, '0');
        const mStr = m.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !clockRef.current) return;

        const rect = clockRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const angle = Math.atan2(clientY - centerY, clientX - centerX);
        let degrees = (angle * 180) / Math.PI + 90;
        if (degrees < 0) degrees += 360;

        if (isDragging === 'hour') {
            let h = Math.round(degrees / 30);
            if (h === 0) h = 12;
            if (h > 12) h = 12;
            handleUpdate(h, minute, ampm);
        } else {
            let m = Math.round(degrees / 6) % 60;
            handleUpdate(hour12, m, ampm);
        }
    };

    const stopDragging = () => setIsDragging(null);

    const hourAngle = (hour12 * 30) + (minute / 2);
    const minuteAngle = minute * 6;

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
                <span className={styles.timeLabel}>
                    {hour12.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')} {ampm}
                </span>
                <span className={styles.clockIcon}>🕒</span>
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div
                        className={styles.clockFace}
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleMouseMove}
                        onMouseUp={stopDragging}
                        onMouseLeave={stopDragging}
                        onTouchEnd={stopDragging}
                    >
                        <svg className={styles.svg} viewBox="0 0 200 200" ref={clockRef}>
                            {/* Face circle */}
                            <circle cx="100" cy="100" r="95" className={styles.outerCircle} />

                            {/* Hour Markers */}
                            {Array.from({ length: 12 }, (_, i) => {
                                const angle = (i + 1) * 30 * (Math.PI / 180);
                                const x = 100 + 75 * Math.sin(angle);
                                const y = 100 - 75 * Math.cos(angle);
                                return (
                                    <text key={i} x={x} y={y} className={styles.number} textAnchor="middle" dominantBaseline="central">
                                        {i + 1}
                                    </text>
                                );
                            })}

                            {/* Minute Ticks */}
                            {Array.from({ length: 60 }, (_, i) => {
                                const angle = i * 6 * (Math.PI / 180);
                                const r1 = i % 5 === 0 ? 88 : 92;
                                return (
                                    <line
                                        key={i}
                                        x1={100 + r1 * Math.sin(angle)}
                                        y1={100 - r1 * Math.cos(angle)}
                                        x2={100 + 95 * Math.sin(angle)}
                                        y2={100 - 95 * Math.cos(angle)}
                                        className={i % 5 === 0 ? styles.majorTick : styles.minorTick}
                                    />
                                );
                            })}

                            {/* Hands */}
                            <g
                                className={styles.handGroup}
                                onMouseDown={() => setIsDragging('hour')}
                                onTouchStart={() => setIsDragging('hour')}
                                style={{ transform: `rotate(${hourAngle}deg)`, transformOrigin: '100px 100px' }}
                            >
                                <line x1="100" y1="100" x2="100" y2="55" className={styles.hourHand} />
                                <circle cx="100" cy="55" r="5" className={styles.handAnchor} />
                            </g>

                            <g
                                className={styles.handGroup}
                                onMouseDown={() => setIsDragging('minute')}
                                onTouchStart={() => setIsDragging('minute')}
                                style={{ transform: `rotate(${minuteAngle}deg)`, transformOrigin: '100px 100px' }}
                            >
                                <line x1="100" y1="100" x2="100" y2="35" className={styles.minuteHand} />
                                <circle cx="100" cy="35" r="4" className={styles.handAnchor} />
                            </g>

                            <circle cx="100" cy="100" r="4" className={styles.centerDot} />
                        </svg>
                    </div>

                    <div className={styles.controls}>
                        <div className={styles.ampmSwitch}>
                            <button
                                className={`${styles.swbtn} ${ampm === 'AM' ? styles.activeAm : ''}`}
                                onClick={() => handleUpdate(hour12, minute, 'AM')}
                            >
                                AM
                            </button>
                            <button
                                className={`${styles.swbtn} ${ampm === 'PM' ? styles.activePm : ''}`}
                                onClick={() => handleUpdate(hour12, minute, 'PM')}
                            >
                                PM
                            </button>
                        </div>
                        <div className={styles.hint}>Drag needles to set time</div>
                    </div>
                </div>
            )}
        </div>
    );
}
