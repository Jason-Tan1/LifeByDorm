import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset window scroll to top-left whenever the route path changes
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

export default ScrollToTop;
