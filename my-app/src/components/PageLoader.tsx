import './PageLoader.css';
import LBDLogo from '../assets/LBDLogo-removebg-preview.png';

const PageLoader = () => {
    return (
        <div className="page-loader-container">
            <div className="loader-content">
                <div className="logo-pulse">
                    <img src={LBDLogo} alt="Loading..." className="loader-logo" />
                </div>
                <div className="loader-spinner"></div>
            </div>
        </div>
    );
};

export default PageLoader;
