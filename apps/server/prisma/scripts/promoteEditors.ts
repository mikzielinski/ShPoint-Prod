{\rtf1\ansi\ansicpg1250\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ PrismaClient \} from "../../generated/prisma";\
const prisma = new PrismaClient();\
\
async function main() \{\
  const emails = (process.env.EDITOR_EMAILS || "")\
    .split(",")\
    .map((s) => s.trim())\
    .filter(Boolean);\
\
  if (emails.length === 0) \{\
    console.log("Brak EDITOR_EMAILS \'96 nic do zrobienia.");\
    return;\
  \}\
\
  for (const email of emails) \{\
    const res = await prisma.user.updateMany(\{\
      where: \{ email \},\
      data: \{ role: "EDITOR" \},\
    \});\
    console.log(`EDITOR -> $\{email\} ($\{res.count\} u\uc0\u380 ytk.)`);\
  \}\
\}\
\
main()\
  .catch((e) => \{\
    console.error(e);\
    process.exit(1);\
  \})\
  .finally(async () => \{\
    await prisma.$disconnect();\
  \});\
}