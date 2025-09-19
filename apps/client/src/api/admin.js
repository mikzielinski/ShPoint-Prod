{
    rtf1;
    ansi;
    ansicpg1250;
    cocoartf2822;
    cocoatextscaling0;
    cocoaplatform0;
    {
        fonttbl;
        f0;
        fswiss;
        fcharset0;
        Helvetica;
    }
    {
        colortbl;
        red255;
        green255;
        blue255;
    }
    {
         * ;
        expandedcolortbl;
        ;
    }
    paperw11900;
    paperh16840;
    margl1440;
    margr1440;
    vieww11520;
    viewh8400;
    viewkind0;
    pard;
    tx720;
    tx1440;
    tx2160;
    tx2880;
    tx3600;
    tx4320;
    tx5040;
    tx5760;
    tx6480;
    tx7200;
    tx7920;
    tx8640;
    pardirnatural;
    partightenfactor0;
    f0;
    fs24;
    cf0;
    const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
    {
        id: string;
        email: string;
        name ?  : string | null;
        avatarUrl ?  : string | null;
        role: Role;
        createdAt ?  : string;
        updatedAt ?  : string;
    }
    ;
}
{
    const qs = new URLSearchParams();
    if (params.search)
        qs.set("search", params.search);
    if (params.role)
        qs.set("role", params.role);
    if (params.page)
        qs.set("page", String(params.page));
    if (params.pageSize)
        qs.set("pageSize", String(params.pageSize));
    if (params.sort)
        qs.set("sort", params.sort);
    const res = await fetch(`$\{API\}/api/admin/users?$\{qs.toString()\}`, { credentials: "include" });
    if (!res.ok)
        throw new Error(`HTTP $\{res.status\}`);
    return res.json();
    {
        items: AdminUser[];
        meta: ;
        {
            total: number;
            page: number;
            pageSize: number;
            pages: number;
        }
    }
     > ;
}
{
    const res = await fetch(`$\{API\}/api/admin/users`, {
        method: "POST", credentials: "include", headers:  }, { "Content-Type": "application/json" }, body, JSON.stringify(body));
}
;
if (!res.ok)
    throw new Error(`HTTP $\{res.status\}`);
return res.json();
{
    user: AdminUser;
}
 > ;
{
    const res = await fetch(`$\{API\}/api/admin/users/$\{id\}`, {
        method: "PATCH", credentials: "include", headers:  }, { "Content-Type": "application/json" }, body, JSON.stringify(body));
}
;
if (!res.ok)
    throw new Error(`HTTP $\{res.status\}`);
return res.json();
{
    user: AdminUser;
}
 > ;
{
    const res = await fetch(`$\{API\}/api/admin/users/$\{id\}/role`, {
        method: "PATCH", credentials: "include", headers:  }, { "Content-Type": "application/json" }, body, JSON.stringify({ role }));
}
;
if (!res.ok)
    throw new Error(`HTTP $\{res.status\}`);
return res.json();
{
    ok: true;
}
 > ;
{
    const res = await fetch(`$\{API\}/api/admin/users/$\{id\}`, { method: "DELETE", credentials: "include" });
    if (!res.ok)
        throw new Error(`HTTP $\{res.status\}`);
    return res.json();
    {
        ok: true;
    }
     > ;
}
{
    const res = await fetch(`$\{API\}/api/admin/users/$\{id\}/impersonate`, { method: "POST", credentials: "include" });
    if (!res.ok)
        throw new Error(`HTTP $\{res.status\}`);
    return res.json();
    {
        ok: true;
    }
     > ;
}
export {};
