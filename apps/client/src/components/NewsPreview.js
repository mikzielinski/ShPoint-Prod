import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const NewsPreview = ({ newsItem }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#16a34a';
            case 'in-progress': return '#f59e0b';
            case 'planned': return '#6b7280';
            default: return '#6b7280';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return '✅';
            case 'in-progress': return '🚧';
            case 'planned': return '📋';
            default: return '📋';
        }
    };
    return (_jsxs("div", { style: {
            background: '#0f172a',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #374151',
            borderLeft: `4px solid ${getStatusColor(newsItem.status)}`,
            maxWidth: '800px',
            margin: '0 auto'
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                }, children: [_jsxs("div", { children: [_jsx("h3", { style: {
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: '#f9fafb',
                                    marginBottom: '8px',
                                    lineHeight: '1.3'
                                }, children: newsItem.title }), _jsx("div", { style: {
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    fontWeight: '500'
                                }, children: new Date(newsItem.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) })] }), _jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: `${getStatusColor(newsItem.status)}20`,
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: getStatusColor(newsItem.status)
                        }, children: [getStatusIcon(newsItem.status), newsItem.status?.toUpperCase() || 'UNKNOWN'] })] }), _jsx("p", { style: {
                    fontSize: '16px',
                    color: '#9ca3af',
                    lineHeight: '1.6',
                    marginBottom: '20px'
                }, children: newsItem.description }), newsItem.content && (_jsxs("div", { style: {
                    background: '#1f2937',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #374151'
                }, children: [_jsx("h4", { style: {
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#f9fafb',
                            marginBottom: '12px'
                        }, children: "Additional Content" }), _jsx("div", { style: {
                            fontSize: '14px',
                            color: '#e5e7eb',
                            lineHeight: '1.6',
                            fontFamily: 'ShatterpointIcons, monospace'
                        }, dangerouslySetInnerHTML: { __html: newsItem.content } })] })), newsItem.images && newsItem.images.length > 0 && (_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h4", { style: {
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#f9fafb',
                            marginBottom: '12px'
                        }, children: "Images" }), _jsx("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '16px'
                        }, children: newsItem.images.map((imageUrl, index) => (_jsxs("div", { style: {
                                position: 'relative',
                                background: '#374151',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #4b5563'
                            }, children: [_jsx("img", { src: imageUrl, alt: `News image ${index + 1}`, style: {
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover'
                                    }, onError: (e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                                    } }), _jsx("div", { style: {
                                        display: 'none',
                                        width: '100%',
                                        height: '200px',
                                        background: '#374151',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#9ca3af',
                                        fontSize: '14px'
                                    }, children: "Failed to load image" })] }, index))) })] })), _jsxs("div", { children: [_jsx("h4", { style: {
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#f9fafb',
                            marginBottom: '12px'
                        }, children: "Features" }), _jsx("div", { style: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px'
                        }, children: newsItem.features.map((feature, featureIndex) => (_jsx("div", { style: {
                                background: '#1f2937',
                                color: '#e5e7eb',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                border: '1px solid #374151'
                            }, children: typeof feature === 'string' ? feature : feature }, featureIndex))) })] }), _jsxs("div", { style: {
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #374151',
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }, children: [_jsxs("div", { children: ["ID: ", _jsx("code", { style: { background: '#374151', padding: '2px 6px', borderRadius: '4px' }, children: newsItem.id })] }), _jsxs("div", { children: [newsItem.features.length, " features \u2022 ", newsItem.images?.length || 0, " images"] })] })] }));
};
export default NewsPreview;
