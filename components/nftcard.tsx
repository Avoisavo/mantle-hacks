import { useState, useEffect } from 'react';

interface NFTCardProps {
    id: number;
    name: string;
    image: string;
    rarity: string;
    price: string;
    description: string;
    color?: string;
    glowColor?: string;
    contractAddress: string;
}

export default function NFTCard({
    id,
    name,
    image,
    rarity,
    price,
    description,
    color = '#00f0ff',
    glowColor = '#00f0ff',
    contractAddress
}: NFTCardProps) {
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePos({ x, y });

        if (isDragging) {
            const deltaX = e.clientX - startX;
            setRotation(prev => prev + deltaX * 0.5);
            setStartX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '300px',
            height: '500px',
        }}>
            {/* Main Card */}
            <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    perspective: '1500px',
                    width: '100%',
                    height: '420px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    animation: 'float 4s ease-in-out infinite',
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                        transform: `rotateY(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                    }}
                >
                    {/* Front Face */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(0deg)',
                            zIndex: 2,
                            borderRadius: '12px',
                            background: 'linear-gradient(180deg, #0d0d1a 0%, #151525 50%, #0d0d1a 100%)',
                            border: '4px solid #7f8c8d',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5)',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E"), linear-gradient(180deg, #2c3e50 0%, #34495e 100%)`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Technical Grid Background */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `
                            linear-gradient(${color}20 1px, transparent 1px),
                            linear-gradient(90deg, ${color}20 1px, transparent 1px)
                        `,
                            backgroundSize: '20px 20px',
                            opacity: 0.3,
                        }} />

                        {/* Hexagonal Pattern Overlay */}
                        <svg style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0.1,
                        }}>
                            <defs>
                                <pattern id={`hex-${id}`} patternUnits="userSpaceOnUse" width="50" height="43.4">
                                    <path d="M25 0 L50 14.4 L50 28.9 L25 43.4 L0 28.9 L0 14.4 Z"
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="0.5"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#hex-${id})`} />
                        </svg>

                        {/* Scanning Line Effect */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(180deg, transparent 0%, ${glowColor}30 50%, transparent 100%)`,
                            height: '100px',
                            animation: 'scan 4s ease-in-out infinite',
                            pointerEvents: 'none',
                        }} />

                        {/* Holographic Shine */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${glowColor}40 0%, transparent 50%)`,
                                mixBlendMode: 'screen',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Corner Brackets */}
                        <div style={{ position: 'absolute', top: '15px', left: '15px', width: '30px', height: '30px', borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
                        <div style={{ position: 'absolute', top: '15px', right: '15px', width: '30px', height: '30px', borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
                        <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '30px', height: '30px', borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '30px', height: '30px', borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />

                        {/* Content Container */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            padding: '25px',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 1,
                        }}>
                            {/* Header Section */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                            }}>
                                <div style={{
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    color: color,
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    background: `linear-gradient(90deg, ${color}30, transparent)`,
                                    padding: '5px 12px',
                                    borderLeft: `3px solid ${color}`,
                                }}>
                                    {rarity} CLASS
                                </div>
                                <div style={{
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    color: '#fff',
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    border: `1px solid ${color}40`,
                                }}>
                                    ID: {String(id).padStart(4, '0')}
                                </div>
                            </div>

                            {/* Central Display Area */}
                            <div style={{
                                flex: 1,
                                position: 'relative',
                                background: `linear-gradient(135deg, ${color}15, rgba(0, 0, 0, 0.4))`,
                                borderRadius: '12px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${color}60`,
                                boxShadow: `inset 0 0 30px ${glowColor}20`,
                                overflow: 'hidden',
                            }}>
                                {/* Circuit Lines */}
                                <svg style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0.3,
                                }}>
                                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke={color} strokeWidth="1" strokeDasharray="5,5">
                                        <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s" repeatCount="indefinite" />
                                    </line>
                                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke={color} strokeWidth="1" strokeDasharray="5,5">
                                        <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s" repeatCount="indefinite" />
                                    </line>
                                </svg>

                                {/* Property Image */}
                                {image.startsWith('/') || image.startsWith('http') ? (
                                    <img
                                        src={image}
                                        alt={name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            borderRadius: '12px',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        fontSize: '80px',
                                        position: 'relative',
                                        zIndex: 1,
                                    }}>
                                        {image}
                                    </div>
                                )}

                                {/* RWA Badge */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    border: `1px solid ${color}`,
                                    zIndex: 2,
                                }}>
                                    <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '9px',
                                        color: color,
                                        letterSpacing: '1px',
                                    }}>
                                        🏠 RWA VERIFIED
                                    </span>
                                </div>
                            </div>

                            {/* Title with Technical Font */}
                            <div style={{
                                fontFamily: 'monospace',
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                marginBottom: '15px',
                                textAlign: 'center',
                                textShadow: `0 0 10px ${glowColor}`,
                            }}>
                                {name}
                            </div>

                            {/* Data Readout */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(0, 0, 0, 0.4)',
                                padding: '12px 15px',
                                borderRadius: '8px',
                                border: `1px solid ${color}30`,
                            }}>
                                <div>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        fontSize: '9px',
                                        color: '#888',
                                        letterSpacing: '1px',
                                        marginBottom: '4px',
                                    }}>
                                        VALUATION
                                    </div>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: color,
                                        textShadow: `0 0 10px ${glowColor}`,
                                    }}>
                                        {price}
                                    </div>
                                </div>
                                <div style={{
                                    width: '2px',
                                    height: '30px',
                                    background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
                                }} />
                                <div style={{
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    color: color,
                                    textAlign: 'right',
                                    lineHeight: '1.6',
                                }}>
                                    STATUS: <span style={{ color: '#0f0' }}>ACTIVE</span><br />
                                    NETWORK: <span style={{ color: '#fff' }}>ONLINE</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back Face */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            zIndex: 1,
                            borderRadius: '12px',
                            background: 'linear-gradient(180deg, #0d0d1a 0%, #151525 50%, #0d0d1a 100%)',
                            border: '4px solid #7f8c8d',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5)',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E"), linear-gradient(180deg, #2c3e50 0%, #34495e 100%)`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Technical Grid Background */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `
                            linear-gradient(${color}20 1px, transparent 1px),
                            linear-gradient(90deg, ${color}20 1px, transparent 1px)
                        `,
                            backgroundSize: '20px 20px',
                            opacity: 0.3,
                        }} />

                        {/* Hexagonal Pattern Overlay */}
                        <svg style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0.1,
                        }}>
                            <defs>
                                <pattern id={`hex-back-${id}`} patternUnits="userSpaceOnUse" width="50" height="43.4">
                                    <path d="M25 0 L50 14.4 L50 28.9 L25 43.4 L0 28.9 L0 14.4 Z"
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="0.5"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#hex-back-${id})`} />
                        </svg>

                        {/* Scanning Line Effect */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(180deg, transparent 0%, ${glowColor}30 50%, transparent 100%)`,
                            height: '100px',
                            animation: 'scan 4s ease-in-out infinite',
                            pointerEvents: 'none',
                        }} />

                        {/* Holographic Shine */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${glowColor}40 0%, transparent 50%)`,
                                mixBlendMode: 'screen',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Corner Brackets */}
                        <div style={{ position: 'absolute', top: '15px', left: '15px', width: '30px', height: '30px', borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
                        <div style={{ position: 'absolute', top: '15px', right: '15px', width: '30px', height: '30px', borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
                        <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '30px', height: '30px', borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '30px', height: '30px', borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />

                        {/* Content */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            padding: '30px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            zIndex: 1,
                        }}>
                            {/* Header */}
                            <div style={{
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                color: color,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                marginBottom: '20px',
                                borderBottom: `1px solid ${color}40`,
                                paddingBottom: '10px',
                            }}>
        
                            </div>

                            {/* Title */}
                            <h3 style={{
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#fff',
                                margin: '0 0 20px 0',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                            }}>
                                {name}
                            </h3>

                            {/* Description */}
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '10px',
                                border: `1px solid ${color}30`,
                            }}>
                                <div style={{
                                    fontFamily: 'monospace',
                                    fontSize: '9px',
                                    color: '#888',
                                    letterSpacing: '1px',
                                    marginBottom: '10px',
                                }}>
                                    DESCRIPTION:
                                </div>
                                <p style={{
                                    color: '#a0aec0',
                                    fontSize: '13px',
                                    lineHeight: '1.7',
                                    margin: 0,
                                    fontFamily: 'system-ui',
                                }}>
                                    {description}
                                </p>
                            </div>

                            {/* Technical Stats Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '5px',
                            }}>
                                <div style={{
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: `1px solid ${color}30`,
                                    textAlign: 'center',
                                }}>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        fontSize: '9px',
                                        color: '#888',
                                        marginBottom: '5px',
                                    }}>
                                        CLASS
                                    </div>
                                    <div style={{
                                        color: color,
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                    }}>
                                        {rarity}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: `1px solid ${color}30`,
                                    textAlign: 'center',
                                }}>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        fontSize: '9px',
                                        color: '#888',
                                        marginBottom: '5px',
                                    }}>
                                        TOKEN
                                    </div>
                                    <div style={{
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                    }}>
                                        #{String(id).padStart(4, '0')}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <a
                                href={`https://sepolia.mantlescan.xyz/address/${contractAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '14px',
                                    background: `linear-gradient(90deg, ${color}20, ${color}40)`,
                                    color: color,
                                    border: `1px solid ${color}`,
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    fontFamily: 'monospace',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    transition: 'all 0.3s',
                                    boxShadow: `0 0 20px ${glowColor}20`,
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                }}
                            >
                                VIEW ON EXPLORER
                            </a>

                            {/* Status Footer */}
                            <div style={{
                                marginTop: '15px',
                                fontFamily: 'monospace',
                                fontSize: '9px',
                                color: '#666',
                                textAlign: 'center',
                                letterSpacing: '1px',
                            }}>
                                PRICE: <span style={{ color: color }}>{price}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                @keyframes scan {
                    0%, 100% { top: -100px; }
                    50% { top: 100%; }
                }
                
                @keyframes rotateRing {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0px);
                        filter: drop-shadow(0 30px 20px rgba(128, 128, 128, 0.4));
                    }
                    50% { 
                        transform: translateY(-15px);
                        filter: drop-shadow(0 45px 25px rgba(128, 128, 128, 0.25));
                    }
                }
            `}</style>
            </div>

            {/* Card Reflection */}
            <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                height: '150px',
                background: `linear-gradient(180deg, ${glowColor}30 0%, transparent 100%)`,
                transform: 'scaleY(-0.3) scaleX(0.9)',
                transformOrigin: 'top center',
                filter: 'blur(8px)',
                opacity: 0.4,
                pointerEvents: 'none',
                borderRadius: '12px',
            }} />
        </div>
    );
}
