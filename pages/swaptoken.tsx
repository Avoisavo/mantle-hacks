import { ConnectButton } from "@rainbow-me/rainbowkit";
import NFTCard from "../components/nftcard";

export default function SwapTokenPage() {
    const nfts = [
        {
            id: 1,
            name: "Quantum Node",
            description: "Advanced quantum computing real estate asset with neural integration capabilities.",
            image: "🌃",
            price: "$2.5M",
            rarity: "Legendary",
            color: "#00f0ff",
            glowColor: "#00f0ff",
        },
        {
            id: 2,
            name: "Cyber Nexus",
            description: "Next-generation cybernetic infrastructure with autonomous operation protocols.",
            image: "🏖️",
            price: "$1.8M",
            rarity: "Epic",
            color: "#00ff88",
            glowColor: "#00ff88",
        },
        {
            id: 3,
            name: "Neural Tower",
            description: "High-density neural processing center with AI integration systems.",
            image: "🏙️",
            price: "$3.2M",
            rarity: "Legendary",
            color: "#ff00ff",
            glowColor: "#ff00ff",
        },
        {
            id: 4,
            name: "Plasma Station",
            description: "Advanced energy distribution facility with quantum field generators.",
            image: "⛷️",
            price: "$4.1M",
            rarity: "Mythic",
            color: "#ffaa00",
            glowColor: "#ffaa00",
        },
        {
            id: 5,
            name: "Void Reactor",
            description: "Experimental antimatter reactor with dimensional stabilization arrays.",
            image: "🏜️",
            price: "$5.5M",
            rarity: "Mythic",
            color: "#ff0066",
            glowColor: "#ff0066",
        },
    ];

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at top, #0a0e1a 0%, #000000 100%)",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Animated Background Grid */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
                animation: "gridMove 20s linear infinite",
            }} />

            {/* Floating Particles */}
            <div style={{
                position: "absolute",
                inset: 0,
                background: `
                    radial-gradient(2px 2px at 20% 30%, rgba(0, 240, 255, 0.3), transparent),
                    radial-gradient(2px 2px at 60% 70%, rgba(0, 255, 136, 0.3), transparent),
                    radial-gradient(2px 2px at 80% 10%, rgba(255, 0, 255, 0.3), transparent),
                    radial-gradient(2px 2px at 40% 80%, rgba(255, 170, 0, 0.3), transparent)
                `,
                backgroundSize: "200% 200%",
                animation: "particleFloat 15s ease-in-out infinite",
            }} />

            <div style={{
                position: "relative",
                zIndex: 1,
                padding: "40px 20px",
            }}>
                {/* Header */}
                <div style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    marginBottom: "60px",
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}>
                        <div>
                            <div style={{
                                fontFamily: "monospace",
                                fontSize: "12px",
                                color: "#00f0ff",
                                letterSpacing: "4px",
                                marginBottom: "10px",
                            }}>
                                // BLOCKCHAIN ASSET REPOSITORY
                            </div>
                            <h1 style={{
                                color: "#fff",
                                fontSize: "56px",
                                fontWeight: "900",
                                margin: "0 0 15px 0",
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                                letterSpacing: "8px",
                                textShadow: "0 0 20px rgba(0, 240, 255, 0.5)",
                            }}>
                                NFT TERMINAL
                            </h1>
                            <p style={{
                                color: "rgba(0, 240, 255, 0.7)",
                                fontSize: "14px",
                                margin: 0,
                                fontFamily: "monospace",
                                letterSpacing: "2px",
                            }}>
                                {'>'} INTERACTIVE 3D ASSET VIEWER • HOVER TO CONTROL ROTATION
                            </p>
                        </div>
                        <ConnectButton />
                    </div>

                    {/* Status Bar */}
                    <div style={{
                        display: "flex",
                        gap: "15px",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#00ff88",
                    }}>
                        <div>
                            <span style={{ color: "#666" }}>ASSETS:</span> {nfts.length}
                        </div>
                        <div>
                            <span style={{ color: "#666" }}>STATUS:</span> ONLINE
                        </div>
                        <div>
                            <span style={{ color: "#666" }}>NETWORK:</span> SECURE
                        </div>
                    </div>
                </div>

                {/* NFT Grid */}
                <div style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "50px",
                    justifyItems: "center",
                }}>
                    {nfts.map((nft) => (
                        <NFTCard
                            key={nft.id}
                            id={nft.id}
                            name={nft.name}
                            description={nft.description}
                            image={nft.image}
                            price={nft.price}
                            rarity={nft.rarity}
                            color={nft.color}
                            glowColor={nft.glowColor}
                        />
                    ))}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes gridMove {
                    from { transform: translateY(0); }
                    to { transform: translateY(50px); }
                }
                
                @keyframes particleFloat {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(30px, -30px); }
                    66% { transform: translate(-20px, 20px); }
                }
            `}</style>
        </div>
    );
}
