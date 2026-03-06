import type { IPageProps } from "../../../../../system/core/types";

export const index = ({ any }: IPageProps) => {
    const images: Array<string> = any('images') || [];
    const firstImage: string = images[0] || "https://via.placeholder.com/800x400";

    return (
        <div className="slider-container js-slider" data-images={JSON.stringify(images)}>
            <div className="slider-wrapper">
                <img 
                    src={firstImage} 
                    alt="Slide" 
                    className="slider-image js-slider-img"
                />
                
                <div className="slider-controls">
                    <button className="control-btn js-prev">❮</button>
                    <button className="control-btn js-next">❯</button>
                </div>

                <div className="slider-dots js-dots">
                    {images.map((_, i) => (
                        <span key={i} className={`dot ${i === 0 ? 'active' : ''}`} data-index={i}></span>
                    ))}
                </div>
            </div>
            
            <div className="slider-status">
                <label>
                    <input type="checkbox" className="js-autoplay" defaultChecked />
                    <span>Auto Play</span>
                </label>
            </div>
        </div>
    );
};