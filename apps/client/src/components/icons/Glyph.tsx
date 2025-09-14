{\rtf1\ansi\ansicpg1250\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import React from "react";\
import \{ GLYPH_ID, type GlyphName \} from "../../lib/glyphs";\
\
export default function Glyph(\{\
  name, size = 16, title, className, style,\
\}: \{ name: GlyphName; size?: number; title?: string; className?: string; style?: React.CSSProperties \}) \{\
  return (\
    <svg\
      width=\{size\} height=\{size\} viewBox="0 0 24 24"\
      role="img" aria-label=\{title\}\
      className=\{className\} style=\{\{ fill: "currentColor", ...style \}\}\
    >\
      \{title ? <title>\{title\}</title> : null\}\
      <use href=\{`#$\{GLYPH_ID[name]\}`\} />\
    </svg>\
  );\
\}\
}