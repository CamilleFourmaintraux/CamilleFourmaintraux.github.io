// Builds the LaTeX source of a CV, from the layout of the generic CV of
// Camille Fourmaintraux (single A4 page, two columns with paracol, readable by
// ATS and AI parsers). Every piece of user text goes through the escaping
// functions below: the output always compiles with pdfLaTeX.
import { parseInline, plainText } from "./inline";
import type {
  Column,
  ContactLine,
  CvDocument,
  CvLanguage,
  EntriesSection,
  IconKey,
  Section,
} from "./model";
import { sidebarTextColor } from "./colors";
import { mailtoOf, qrLinkOf } from "./links";

export const PHOTO_FILE = "photo.jpg";

const ICON_COMMANDS: Record<IconKey, string> = {
  phone: "\\faMobile*",
  email: "\\faEnvelope",
  website: "\\faGlobe",
  linkedin: "\\faLinkedin",
  github: "\\faGithub",
  gitlab: "\\faGitlab",
  address: "\\faMapMarker*",
  link: "\\faLink",
  youtube: "\\faYoutube",
  discord: "\\faDiscord",
  calendar: "\\faCalendar*",
  car: "\\faCar",
  language: "\\faLanguage",
  user: "\\faUser",
};

const SPECIAL: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  $: "\\$",
  "&": "\\&",
  "#": "\\#",
  "^": "\\textasciicircum{}",
  _: "\\_",
  "%": "\\%",
  "~": "\\textasciitilde{}",
};

// Characters pdfLaTeX handles with the T1 encoding. Others (emoji...) are left out.
const UNSUPPORTED =
  /[^\t\n\x20-\x7e\u00a0-\u017f\u2010-\u2026\u2030\u2039\u203a\u20ac\u2122]/gu;

/** Characters of the text that cannot be written in the LaTeX file. */
export function unsupportedCharacters(text: string): string[] {
  return [...new Set(text.match(UNSUPPORTED) ?? [])];
}

/** Plain text, escaped for LaTeX. */
export function escapeTex(text: string): string {
  return text
    .replace(UNSUPPORTED, "")
    .replace(/[\\{}$&#^_%~]/g, (character) => SPECIAL[character])
    .replace(/\u2026/g, "\\dots{}")
    .replace(/\u00a0/g, "~");
}

/** Text with its **bold**, *italic* and ^superscript^ markup. */
function rich(text: string): string {
  return parseInline(text)
    .map(({ text: part, style }) => {
      const escaped = escapeTex(part);
      if (style === "bold") return `\\textbf{${escaped}}`;
      if (style === "italic") return `\\textit{${escaped}}`;
      if (style === "sup") return `\\textsuperscript{${escaped}}`;
      return escaped;
    })
    .join("");
}

/** Several lines: each line break of the form becomes a line break of the CV. */
const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(rich)
    .join("\\\\\n    ");

/** Address for \href and \qrcode, which both expect these characters escaped. */
function escapeUrl(url: string): string {
  return url
    .trim()
    .replace(UNSUPPORTED, "")
    .replace(/\s/g, "%20")
    .replace(/[\\{}]/g, "")
    .replace(/[#%&_~$^]/g, (character) => `\\${character}`);
}

/** Long words (addresses, emails) may break after these characters. */
const breakable = (text: string) =>
  escapeTex(text).replace(/([/.@-])(?=.)/g, "$1\\allowbreak{}");

const hasText = (text: string) => plainText(text).trim().length > 0;

function contactContent(line: ContactLine): string {
  const value = line.value.trim();
  const href =
    line.icon === "email" && !line.href.trim()
      ? mailtoOf(value)
      : line.href.trim();
  if (!href) return lines(value);
  // The PDF keeps the exact text for parsers, the page may wrap it.
  const shown = value.includes("\n") ? lines(value) : breakable(value);
  return `\\href{${escapeUrl(href)}}{%\n    \\exacttext{${escapeTex(value.replace(/\n/g, " "))}}{${shown}}}`;
}

function title(section: Section, column: Column): string {
  const command = column === "main" ? "mainsection" : "sidesection";
  return `\\${command}{${escapeTex(section.title.trim())}}`;
}

/** Paragraph indented like the sidebar texts of the original CV. */
const paragraph = (content: string, column: Column) =>
  column === "side"
    ? `{\\raggedright\\leftskip=0.6em ${content}\\par}`
    : `{${content}\\par}`;

function entries(section: EntriesSection): string | null {
  const environment = section.numbered ? "enumerate" : "itemize";
  const items = section.entries
    .map((entry) => {
      const details = entry.details.filter((detail) => hasText(detail.text));
      const head = [
        hasText(entry.title) ? `\\textbf{${rich(entry.title.trim())}}` : "",
        hasText(entry.text) ? rich(entry.text.trim()) : "",
        hasText(entry.tools) ? `\\textit{(${rich(entry.tools.trim())})}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const subtitle = hasText(entry.subtitle)
        ? `\\textit{${rich(entry.subtitle.trim())}}`
        : "";
      if (!head && !subtitle && details.length === 0) return null;
      let out = `  \\item ${head}`;
      if (subtitle) out += head ? `\\\\\n        ${subtitle}` : subtitle;
      if (details.length > 0) {
        out += "\n  \\begin{details}\n";
        out += details
          .map((detail) => `    \\item ${rich(detail.text.trim())}`)
          .join("\n");
        out += "\n  \\end{details}";
      }
      return out;
    })
    .filter((value): value is string => value !== null);
  if (items.length === 0) return null;
  return `\\begin{${environment}}\n${items.join("\n")}\n\\end{${environment}}`;
}

/** Body of a section, or null when it has nothing to show. */
function body(
  section: Section,
  column: Column,
  language: CvLanguage,
  sidebarColor: string,
): string | null {
  switch (section.kind) {
    case "text": {
      const paragraphs = section.body
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(hasText)
        .map((part) => part.split("\n").map(rich).join("\n"));
      return paragraphs.length
        ? paragraph(paragraphs.join("\\par\n"), column)
        : null;
    }
    case "entries":
      return entries(section);
    case "skills": {
      const groups = section.groups.filter((group) => hasText(group.items));
      if (groups.length === 0) return null;
      return groups
        .map((group) =>
          hasText(group.name)
            ? `\\skillcat{${rich(group.name.trim())}}{${lines(group.items)}}`
            : paragraph(lines(group.items), column),
        )
        .join("\n");
    }
    case "list": {
      const items = section.items
        .map((entry) => entry.text.trim())
        .filter(hasText);
      return items.length
        ? paragraph(items.map(rich).join(", "), column)
        : null;
    }
    case "contact": {
      const separator = language === "fr" ? " : " : ": ";
      const contacts = section.lines.filter((line) => line.value.trim());
      if (contacts.length === 0) return null;
      return contacts
        .map((line) => {
          const label = escapeTex((line.label.trim() || line.icon) + separator);
          return `\\contactline{${label}}{${ICON_COMMANDS[line.icon]}}{${contactContent(line)}}`;
        })
        .join("\n");
    }
    case "portfolio": {
      const description = hasText(section.description)
        ? rich(section.description.trim())
        : "";
      const url = section.url.trim();
      if (url && section.qr) {
        const qr = escapeUrl(qrLinkOf(url));
        // On a dark sidebar the code gets a white frame, or phones cannot read it.
        const dark =
          column === "side" && sidebarTextColor(sidebarColor) === "#ffffff";
        const symbol = `\\qrcode[height=2.1cm]{${qr}}`;
        const code = dark
          ? `\\href{${qr}}{\\setlength{\\fboxsep}{2pt}\\colorbox{white}{\\color{black}${symbol}}}`
          : `\\href{${qr}}{${symbol}}`;
        if (!description) return code + "\\par";
        return [
          "\\begin{minipage}[c]{\\dimexpr\\linewidth-2.4cm\\relax}",
          `  \\raggedright${column === "side" ? "\\leftskip=0.6em " : " "}${description}`,
          "\\end{minipage}\\hfill",
          "\\begin{minipage}[c]{2.1cm}",
          `  ${code}`,
          "\\end{minipage}\\par",
        ].join("\n");
      }
      const link = url ? `\\href{${escapeUrl(url)}}{${breakable(url)}}` : "";
      const content = [description, link].filter(Boolean).join("\\\\\n");
      return content ? paragraph(content, column) : null;
    }
  }
}

function column(cv: CvDocument, which: Column): string {
  return cv.sections
    .filter((section) => section.visible && section.column === which)
    .map((section) => {
      const content = body(section, which, cv.language, cv.layout.sidebarColor);
      if (content === null) return null;
      const heading = section.title.trim() ? `${title(section, which)}\n` : "";
      return `%------------------------------- ${escapeComment(section.title) || section.kind}\n${heading}${content}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

const escapeComment = (text: string) =>
  text.replace(UNSUPPORTED, "").replace(/[\n%]/g, " ").trim();

/** Comma-separated keywords for the PDF metadata, taken from the skills. */
function keywords(cv: CvDocument): string {
  const words = [cv.name, "CV", cv.headline];
  for (const section of cv.sections) {
    if (section.kind !== "skills" || !section.visible) continue;
    for (const group of section.groups) {
      words.push(...plainText(group.items).split(/[,\n]/));
    }
  }
  const unique = [
    ...new Set(
      words.map((word) => word.replace(/[()]/g, "").trim()).filter(Boolean),
    ),
  ];
  return unique.map(escapeTex).join(", ");
}

const hex = (color: string) => color.replace("#", "").toUpperCase();

function photoBlock(cv: CvDocument): string {
  if (!cv.photo) return "";
  const alt = escapeTex(
    cv.language === "fr"
      ? `Photo de ${cv.name.trim()}`
      : `Photo of ${cv.name.trim()}`,
  );
  const clip =
    cv.photo.shape === "round"
      ? [
          "\\clip (0,0) circle (1.65cm);",
          "\\draw[white, line width=1.5pt] (0,0) circle (1.65cm);",
        ]
      : [
          "\\clip (-1.65cm,-1.65cm) rectangle (1.65cm,1.65cm);",
          "\\draw[white, line width=1.5pt] (-1.65cm,-1.65cm) rectangle (1.65cm,1.65cm);",
        ];
  return [
    "%------------------------------- Photo",
    `% Expects ${PHOTO_FILE} next to this file`,
    `{\\centering\\BeginAccSupp{method=pdfstringdef,Alt={${alt}}}%`,
    "\\begin{tikzpicture}",
    "  \\begin{scope}",
    `    ${clip[0]}`,
    `    \\node[inner sep=0pt] at (0,0) {\\includegraphics[width=3.3cm]{${PHOTO_FILE.replace(/\.jpg$/, "")}}};`,
    "  \\end{scope}",
    `  ${clip[1]}`,
    "\\end{tikzpicture}%",
    "\\EndAccSupp{}\\par}",
    "\\vspace{-4pt}",
    "",
  ].join("\n");
}

export function toLatex(cv: CvDocument): string {
  const french = cv.language === "fr";
  const sideRatio = (cv.layout.sidebarWidth / 100).toFixed(2);
  const mainRatio = (1 - cv.layout.sidebarWidth / 100).toFixed(2);
  const sidebarLeft = cv.layout.sidebar === "left";
  const name = escapeTex(cv.name.trim());
  const headline = escapeTex(cv.headline.trim());
  const usesQr = cv.sections.some(
    (section) =>
      section.visible &&
      section.kind === "portfolio" &&
      section.qr &&
      section.url.trim(),
  );

  const header = [
    "%------------------------------- Header",
    name
      ? `{\\namefont\\fontsize{27}{31}\\selectfont ${name}}\\par\\vspace{1pt}`
      : "",
    name ? "\\rule{0.30\\linewidth}{3pt}\\par\\vspace{8pt}" : "",
    headline
      ? `{\\fontsize{14.5}{16}\\selectfont\\bfseries ${headline}}\\par`
      : "",
    "\\vspace{2pt}",
  ]
    .filter(Boolean)
    .join("\n");

  const main = [header, column(cv, "main")].filter(Boolean).join("\n\n");
  const side = [
    "\\small\\color{sidebartext}",
    photoBlock(cv),
    column(cv, "side"),
  ]
    .filter(Boolean)
    .join("\n\n");

  // The sidebar background covers the whole page height, up to the paper edge.
  const background = sidebarLeft
    ? [
        "\\AddToShipoutPictureBG{%",
        "  \\AtPageLowerLeft{%",
        "    \\color{sidebarbg}%",
        "    \\rule{\\dimexpr 1in+\\hoffset+\\oddsidemargin",
        "               +\\sideratio\\dimexpr\\textwidth-\\columnsep\\relax",
        "               +\\sidebarpad\\relax}{\\paperheight}}}",
      ]
    : [
        "\\AddToShipoutPictureBG{%",
        "  \\AtPageLowerLeft{%",
        "    \\hspace*{\\dimexpr 1in+\\hoffset+\\oddsidemargin",
        "                     +\\mainratio\\dimexpr\\textwidth-\\columnsep\\relax",
        "                     +\\columnsep-\\sidebarpad\\relax}%",
        "    \\color{sidebarbg}%",
        "    \\rule{\\paperwidth}{\\paperheight}}}",
      ];

  return `%==============================================================================
% Curriculum Vitae${name ? ` - ${escapeComment(cv.name)}` : ""}
% Made with the CV generator of https://camillefourmaintraux.github.io/#/cv-generator
%
% Two-column layout inspired by Jan Kuester's paracol CV template (MIT License),
% made to stay readable by ATS / AI parsers:
%   - each column is typeset as a whole block, so text extraction keeps it together
%   - every icon carries a hidden text label (PDF /ActualText)
%   - every glyph is mapped to Unicode (glyphtounicode): clean copy/paste
%
% Fonts: Carlito (free metric clone of Calibri) and URW Avant Garde (close to
% Century Gothic). Both ship with TeX Live / Overleaf.
% Compile with pdfLaTeX (Overleaf: Menu > Compiler > pdfLaTeX)
%==============================================================================
\\documentclass[10pt,a4paper]{article}

%------------------------------- Encoding and fonts ---------------------------
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[${french ? "french" : "english"}]{babel}
${french ? "\\frenchsetup{StandardLists=true}        % keep list layout under enumitem's control\n" : ""}% Never hyphenate technology names: a split keyword no longer matches
\\babelhyphenation[${french ? "french" : "english"}]{webMethods JavaScript TypeScript PostgreSQL MongoDB Firebase
  Bootstrap Tailwind Kotlin Postman DBeaver Polytech Hibernate Angular JUnit}
\\usepackage[sfdefault,lf]{carlito}      % Calibri-like body font
\\newcommand{\\namefont}{\\fontfamily{pag}\\selectfont}  % Avant Garde (Century Gothic-like)
\\usepackage{fontawesome5}
\\usepackage{accsupp}                    % hidden text labels for icons
\\usepackage{microtype}
% Carlito maps "fi"/"fl" ligatures to single Unicode characters, which breaks
% keyword matching; typeset them as separate letters instead
\\DisableLigatures[f]{encoding = *, family = *}

% Map every glyph to Unicode so text extraction (ATS, AI parsers) is exact
\\input{glyphtounicode}
\\pdfgentounicode=1

%------------------------------- Page layout ----------------------------------
\\usepackage[a4paper,top=1.0cm,bottom=0.8cm,${sidebarLeft ? "left=0.8cm,right=1.2cm" : "left=1.2cm,right=0.8cm"}]{geometry}
\\usepackage{paracol}
\\usepackage{eso-pic}
\\usepackage[dvipsnames]{xcolor}
\\usepackage{enumitem}
${usesQr ? "\\usepackage{qrcode}\n" : ""}${cv.photo ? "\\usepackage{tikz}                       % photo clipped to its shape\n" : ""}
\\definecolor{sidebarbg}{HTML}{${hex(cv.layout.sidebarColor)}}
\\definecolor{accent}{HTML}{${hex(cv.layout.accentColor)}}
\\definecolor{rulegray}{RGB}{60,60,60}
\\definecolor{sidebartext}{HTML}{${hex(sidebarTextColor(cv.layout.sidebarColor))}}

\\usepackage[
  pdftitle={${name}${headline ? ` - CV - ${headline}` : " - CV"}},
  pdfauthor={${name}},
  pdfsubject={Curriculum Vitae${headline ? ` - ${headline}` : ""}},
  pdfkeywords={${keywords(cv)}},
  colorlinks=true,
  urlcolor=accent,
  linkcolor=accent,
  pdfstartview=    % no /OpenAction: some upload scanners flag it as suspicious script
]{hyperref}
\\urlstyle{same}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\emergencystretch}{1.5em}    % lets TeX loosen a line rather than overflow the margin

% Column geometry: the sidebar takes ${cv.layout.sidebarWidth}% of the usable width
\\newcommand{\\mainratio}{${mainRatio}}
\\newcommand{\\sideratio}{${sideRatio}}
\\setlength{\\columnsep}{1.25cm}
\\newcommand{\\sidebarpad}{0.6cm}         % sidebar background goes this far past its text

% Full-height sidebar background, drawn behind the ${sidebarLeft ? "left" : "right"} column
${background.join("\n")}

%------------------------------- Lists ----------------------------------------
\\setlist[itemize,1]{label=\\textbullet, leftmargin=1.1em, itemsep=2.5pt, topsep=1pt, parsep=0pt}
\\newlist{details}{itemize}{1}
\\setlist[details]{label=--, leftmargin=1.6em, itemsep=0.5pt, topsep=0pt, parsep=0pt}
\\setlist[enumerate,1]{label=\\arabic*., leftmargin=1.4em, itemsep=2.5pt, topsep=1pt, parsep=0pt}

%------------------------------- CV commands ----------------------------------
% Main-column section title with a full-width rule underneath
\\newcommand{\\mainsection}[1]{%
  \\vspace{10pt}%
  {\\fontsize{14.5}{16}\\selectfont\\bfseries #1}\\par\\nointerlineskip\\vspace{3pt}%
  {\\color{rulegray}\\rule{\\linewidth}{0.6pt}}\\par\\vspace{1pt}}

% Sidebar section title
\\newcommand{\\sidesection}[1]{%
  \\vspace{13pt}%
  {\\fontsize{14.5}{16}\\selectfont\\bfseries #1}\\par\\vspace{4pt}}

% Icon with a hidden text label
\\newcommand{\\labelicon}[2]{%
  \\BeginAccSupp{method=pdfstringdef,ActualText={#1}}#2\\EndAccSupp{}}

% Text that wraps on screen but is extracted as one exact string
\\newcommand{\\exacttext}[2]{%
  \\BeginAccSupp{method=pdfstringdef,ActualText={#1}}#2\\EndAccSupp{}}

% Contact line: \\contactline{hidden label}{icon}{content}
\\newcommand{\\contactline}[3]{%
  \\makebox[1.7em][l]{\\large\\labelicon{#1}{#2}}%
  \\parbox[t]{\\dimexpr\\linewidth-1.7em\\relax}{\\raggedright #3}\\par\\vspace{5pt}}

% Skill category: bold title, indented items
\\newcommand{\\skillcat}[2]{%
  {\\bfseries #1}\\par
  {\\raggedright\\leftskip=0.6em #2\\par}\\vspace{3.5pt}}

%==============================================================================
\\begin{document}
\\columnratio{${sidebarLeft ? "\\sideratio" : "\\mainratio"}}
\\begin{paracol}{2}

%==============================================================================
%   ${sidebarLeft ? "SIDEBAR (left)" : "MAIN COLUMN (left)"}
%==============================================================================
\\begin{leftcolumn}
${sidebarLeft ? side : main}

\\end{leftcolumn}

%==============================================================================
%   ${sidebarLeft ? "MAIN COLUMN (right)" : "SIDEBAR (right)"}
%==============================================================================
\\begin{rightcolumn}
${sidebarLeft ? main : side}

\\end{rightcolumn}
\\end{paracol}
\\end{document}
`;
}
