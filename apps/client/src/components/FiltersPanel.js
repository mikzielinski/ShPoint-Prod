import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
export default function FiltersPanel({ facets, filters, onChange, darkMode = false, hideTags = false, hideFactions = false, unitTypeLabel = "Unit Types", }) {
    const [open, setOpen] = useState(null);
    // zamykanie po kliknięciu poza
    const rootRef = useRef(null);
    useEffect(() => {
        function onDoc(e) {
            if (!rootRef.current)
                return;
            if (!rootRef.current.contains(e.target))
                setOpen(null);
        }
        document.addEventListener("click", onDoc);
        return () => document.removeEventListener("click", onDoc);
    }, []);
    const toggle = (k) => {
        setOpen((cur) => (cur === k ? null : k));
    };
    const applyMulti = (key, value, checked) => {
        const prev = new Set(filters[key] ?? []);
        if (checked)
            prev.add(value);
        else
            prev.delete(value);
        onChange({ ...filters, [key]: Array.from(prev) });
    };
    // Helper function to get display text for dropdown buttons
    const getButtonText = (type, label) => {
        const values = filters[type];
        if (!values || values.length === 0)
            return label;
        if (values.length === 1)
            return `${label}: ${values[0]}`;
        return `${label}: ${values.length} selected`;
    };
    return (_jsxs("div", { ref: rootRef, className: darkMode ? "" : "filters-row", style: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'center',
            gap: '12px',
            ...(darkMode ? {
                background: 'transparent',
                border: 'none',
                padding: '0',
                marginBottom: '0'
            } : {})
        }, children: [_jsx("input", { value: filters.text ?? "", onChange: (e) => onChange({ ...filters, text: e.target.value }), className: darkMode ? "" : "filter-input", style: darkMode ? {
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f9fafb',
                    fontSize: '14px',
                    width: '200px'
                } : {}, placeholder: "Search name / tag / faction...", "aria-label": "Search by text" }), _jsx("button", { className: darkMode ? "" : "btn-clear", style: darkMode ? {
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f9fafb',
                    fontSize: '14px',
                    cursor: 'pointer'
                } : {}, onClick: () => onChange({}), disabled: !(filters.text ||
                    filters.unitTypes?.length ||
                    (!hideFactions && filters.factions?.length) ||
                    filters.eras?.length ||
                    (!hideTags && filters.tags?.length)), children: "Clear all" }), _jsxs("div", { className: darkMode ? "" : "dropdown", style: darkMode ? { position: 'relative' } : {}, children: [_jsx("button", { className: darkMode ? "" : "chip", style: darkMode ? {
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #374151',
                            background: '#1f2937',
                            color: '#f9fafb',
                            fontSize: '14px',
                            cursor: 'pointer'
                        } : {}, onClick: () => toggle("unit"), "aria-expanded": open === "unit", "data-active": filters.unitTypes && filters.unitTypes.length > 0, children: getButtonText("unitTypes", unitTypeLabel) }), open === "unit" && (_jsx("div", { className: darkMode ? "" : "dropdown-menu", style: darkMode ? {
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            padding: '8px',
                            zIndex: 1000,
                            minWidth: '200px'
                        } : {}, children: facets.unitTypes.map((u) => {
                            const checked = !!filters.unitTypes?.includes(u);
                            return (_jsxs("label", { className: darkMode ? "" : "dropdown-row", style: darkMode ? {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '4px 0',
                                    color: '#f9fafb',
                                    cursor: 'pointer'
                                } : {}, children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => applyMulti("unitTypes", u, e.currentTarget.checked), style: darkMode ? {
                                            accentColor: '#3b82f6'
                                        } : {} }), _jsx("span", { style: darkMode ? {
                                            color: '#f9fafb',
                                            fontSize: '14px'
                                        } : {}, children: u })] }, u));
                        }) }))] }), !hideFactions && (_jsxs("div", { className: darkMode ? "" : "dropdown", style: darkMode ? { position: 'relative' } : {}, children: [_jsx("button", { className: darkMode ? "" : "chip", style: darkMode ? {
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #374151',
                            background: '#1f2937',
                            color: '#f9fafb',
                            fontSize: '14px',
                            cursor: 'pointer'
                        } : {}, onClick: () => toggle("faction"), "aria-expanded": open === "faction", "data-active": filters.factions && filters.factions.length > 0, children: getButtonText("factions", "Faction") }), open === "faction" && (_jsx("div", { className: darkMode ? "" : "dropdown-menu", style: darkMode ? {
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            padding: '8px',
                            zIndex: 1000,
                            minWidth: '200px'
                        } : {}, children: facets.factions.map((f) => {
                            const checked = !!filters.factions?.includes(f);
                            return (_jsxs("label", { className: darkMode ? "" : "dropdown-row", style: darkMode ? {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '4px 0',
                                    color: '#f9fafb',
                                    cursor: 'pointer'
                                } : {}, children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => applyMulti("factions", f, e.currentTarget.checked), style: darkMode ? {
                                            accentColor: '#3b82f6'
                                        } : {} }), _jsx("span", { style: darkMode ? {
                                            color: '#f9fafb',
                                            fontSize: '14px'
                                        } : {}, children: f })] }, f));
                        }) }))] })), _jsxs("div", { className: darkMode ? "" : "dropdown", style: darkMode ? { position: 'relative' } : {}, children: [_jsx("button", { className: darkMode ? "" : "chip", style: darkMode ? {
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #374151',
                            background: '#1f2937',
                            color: '#f9fafb',
                            fontSize: '14px',
                            cursor: 'pointer'
                        } : {}, onClick: () => toggle("era"), "aria-expanded": open === "era", "data-active": filters.eras && filters.eras.length > 0, children: getButtonText("eras", "Era") }), open === "era" && (_jsx("div", { className: darkMode ? "" : "dropdown-menu", style: darkMode ? {
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            padding: '8px',
                            zIndex: 1000,
                            minWidth: '200px'
                        } : {}, children: facets.eras.map((era) => {
                            const checked = !!filters.eras?.includes(era);
                            return (_jsxs("label", { className: darkMode ? "" : "dropdown-row", style: darkMode ? {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '4px 0',
                                    color: '#f9fafb',
                                    cursor: 'pointer'
                                } : {}, children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => applyMulti("eras", era, e.currentTarget.checked), style: darkMode ? {
                                            accentColor: '#3b82f6'
                                        } : {} }), _jsx("span", { style: darkMode ? {
                                            color: '#f9fafb',
                                            fontSize: '14px'
                                        } : {}, children: era })] }, era));
                        }) }))] }), !hideTags && (_jsxs("div", { className: darkMode ? "" : "dropdown", style: darkMode ? { position: 'relative' } : {}, children: [_jsx("button", { className: darkMode ? "" : "chip", style: darkMode ? {
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #374151',
                            background: '#1f2937',
                            color: '#f9fafb',
                            fontSize: '14px',
                            cursor: 'pointer'
                        } : {}, onClick: () => toggle("tags"), "aria-expanded": open === "tags", "data-active": filters.tags && filters.tags.length > 0, children: getButtonText("tags", "Tags") }), open === "tags" && (_jsx("div", { className: darkMode ? "" : "dropdown-menu dropdown-wide", style: darkMode ? {
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            padding: '8px',
                            zIndex: 1000,
                            minWidth: '360px'
                        } : {}, children: facets.tags.map((t) => {
                            const checked = !!filters.tags?.includes(t);
                            return (_jsxs("label", { className: darkMode ? "" : "dropdown-row", style: darkMode ? {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '4px 0',
                                    color: '#f9fafb',
                                    cursor: 'pointer'
                                } : {}, children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => applyMulti("tags", t, e.currentTarget.checked), style: darkMode ? {
                                            accentColor: '#3b82f6'
                                        } : {} }), _jsx("span", { style: darkMode ? {
                                            color: '#f9fafb',
                                            fontSize: '14px'
                                        } : {}, children: t })] }, t));
                        }) }))] }))] }));
}
