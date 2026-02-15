enum ChartDir {
    LR = "LR",
    TD = "TD",
    TB = "TB",
    RL = "RL",
    BT = "BT",
}

enum NodeShape {
    RECT_ROUND = "(VAL)",
    STADIUM = "([VAL])",
    SUBROUTINE = "[[VAL]]",
    CYLINDER = "[(VAL)]",
    CIRCLE = "((VAL))",
    ASSYMETRIC = ">VAL]",
    RHOMBUS = "{VAL}",
    HEXAGON = "{{VAL}}",
}

enum LinkType {
    ARROW = "-->",
    OPEN = "---",
    INVISIBLE = "~~~",
}

interface INodeStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
    color?: string;
    strokeDasharray?: string | number[];
}

class NodeStyle implements INodeStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
    color?: string;
    strokeDasharray?: string | number[];

    constructor({ fill, stroke, strokeWidth, color, strokeDasharray }: INodeStyle) {
        this.fill = fill;
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
        this.color = color;
        this.strokeDasharray = strokeDasharray;
    }

    toString(): string {
        const result: string[] = [];
        if (this.fill) result.push(`fill:${this.fill}`);
        if (this.stroke) result.push(`stroke:${this.stroke}`);
        if (this.strokeWidth) result.push(`stroke-width:${this.strokeWidth}`);
        if (this.color) result.push(`color:${this.color}`);
        let strokeDasharray = '';
        if (this.strokeDasharray) {
            if (Array.isArray(this.strokeDasharray)) {
                strokeDasharray = this.strokeDasharray.join(' ');
            } else {
                strokeDasharray = this.strokeDasharray;
            }
            result.push(`stroke-dasharray:${strokeDasharray}`);
        }
        return result.join(',');
    }
}

class ChartNode {
    title: string;
    shape: NodeShape;
    id: string;
    className?: string;

    constructor(title = '', shape = NodeShape.RECT_ROUND, id = '', className?: string) {
        this.title = title;
        this.shape = shape;
        this.id = id;
        this.className = className;
    }

    private ensureId(): void {
        if (!this.id && this.title) {
            this.id = this.title.replace(/[^a-zA-Z0-9\-_!#$]+/g, '');
        }
    }

    getId(): string {
        this.ensureId();
        return this.id;
    }

    toString(): string {
        this.ensureId();
        const classNameSuffix = this.className ? `:::${this.className}` : '';
        return `${this.id}${this.shape.replace('VAL', this.title)}${classNameSuffix}`;
    }
}

interface ILinkStyle {
    stroke?: string;
    strokeWidth?: string;
    color?: string;
}

class LinkStyle implements ILinkStyle {
    stroke?: string;
    strokeWidth?: string;
    color?: string;

    constructor({ stroke, strokeWidth, color }: ILinkStyle) {
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
        this.color = color;
    }

    toString(): string {
        const result: string[] = [];
        if (this.stroke) result.push(`stroke:${this.stroke}`);
        if (this.strokeWidth) result.push(`stroke-width:${this.strokeWidth}`);
        if (this.color) result.push(`color:${this.color}`);
        return result.join(',');
    }
}

class Link {
    src: string | ChartNode;
    dest: string | ChartNode;
    text?: string;
    type: LinkType;
    style?: string | LinkStyle;

    constructor(src: string | ChartNode, dest: string | ChartNode, text?: string, type = LinkType.ARROW, style?: string | LinkStyle) {
        this.src = src;
        this.dest = dest;
        this.text = text;
        this.type = type;
        this.style = style;
    }

    toString(): string {
        const srcId = typeof this.src === 'string' ? this.src : this.src.getId();
        const destId = typeof this.dest === 'string' ? this.dest : this.dest.getId();
        const linkText = this.text ? `|${this.text}|` : '';
        return `${srcId} ${this.type} ${linkText}${destId}`;
    }

    printStyle(linkCount: number): string {
        if (!this.style) {
            return '';
        }
        const style = typeof this.style === 'string' ? this.style : this.style.toString();
        return `linkStyle ${linkCount} ${style};`;
    }
}

class ClassDef {
    classNames: string | string[];
    style: string | NodeStyle;

    constructor(classNames: string | string[], style: string | NodeStyle) {
        this.classNames = classNames;
        this.style = style;
    }

    toString(): string {
        const classNames = Array.isArray(this.classNames) ? this.classNames.join(',') : this.classNames;
        return `classDef ${classNames} ${this.style.toString()}`;
    }
}

class ClassAttachment {
    nodes: string | ChartNode | (string | ChartNode)[];
    className: string;

    constructor(nodes: string | ChartNode | (string | ChartNode)[], className: string) {
        this.nodes = nodes;
        this.className = className;
    }

    toString(): string {
        let nodesArray: string[];
        if (typeof this.nodes === 'string') {
            nodesArray = [this.nodes];
        } else if (this.nodes instanceof ChartNode) {
            nodesArray = [this.nodes.getId()];
        } else {
            nodesArray = this.nodes.map((node: string | ChartNode) => (typeof node === 'string' ? node : node.getId()));
        }
        return `class ${nodesArray.join(',')} ${this.className};`;
    }
}

class Chart {
    title?: string;
    direction: ChartDir;
    nodes: ChartNode[];
    links: Link[];
    subgraphs: Subgraph[];
    classDefs: ClassDef[];
    classAttachments: ClassAttachment[];
    positionalLinkStyles: [number, string | LinkStyle][];

    constructor(title?: string, direction = ChartDir.TD) {
        this.title = title;
        this.direction = direction;
        this.nodes = [];
        this.links = [];
        this.subgraphs = [];
        this.classDefs = [];
        this.classAttachments = [];
        this.positionalLinkStyles = [];
    }

    static parse(input: string): Chart {
        return parseFlowchart(input);
    }

    toString(): string {
        return this.print('', 0).text;
    }

    protected printBody(indent: string, linkCount: number): { text: string; nextLinkCount: number } {
        const result: string[] = [];
        let currentLinkCount = linkCount;
        for (const node of this.nodes) {
            result.push(indent + node.toString());
        }
        for (const link of this.links) {
            result.push(indent + link.toString());
            if (link.style) {
                result.push(indent + link.printStyle(currentLinkCount));
            }
            currentLinkCount += 1;
        }
        for (const subgraph of this.subgraphs) {
            const subgraphResult = subgraph.print(indent, currentLinkCount);
            result.push(subgraphResult.text);
            currentLinkCount = subgraphResult.nextLinkCount;
        }
        for (const classDef of this.classDefs) {
            result.push(indent + classDef.toString());
        }
        for (const classAttachment of this.classAttachments) {
            result.push(indent + classAttachment.toString());
        }
        for (const [linkPos, style] of this.positionalLinkStyles) {
            const normalizedStyle = typeof style === 'string' ? style : style.toString();
            result.push(indent + `linkStyle ${linkPos} ${normalizedStyle};`);
        }
        return { text: result.join('\n'), nextLinkCount: currentLinkCount };
    }

    print(indent: string, linkCount: number): { text: string; nextLinkCount: number } {
        const currentIndent = indent;
        const result: string[] = [];
        if (this.title) {
            result.push(`${currentIndent}---`);
            result.push(`${currentIndent}title: ${this.title}`);
            result.push(`${currentIndent}---`);
        }
        result.push(`${currentIndent}flowchart ${this.direction}`);
        const body = this.printBody(currentIndent + '  ', linkCount);
        result.push(body.text);
        result.push('');
        return { text: result.join('\n'), nextLinkCount: body.nextLinkCount };
    }

    addNode(node: ChartNode | string): this {
        if (typeof node === 'string') {
            node = new ChartNode(node);
        }
        this.nodes.push(node);
        return this;
    }

    addNodes(nodes: ChartNode[]): this {
        this.nodes.push(...nodes);
        return this;
    }

    addLink(link: Link): this {
        this.links.push(link);
        return this;
    }

    addClassDef(classDef: ClassDef): this {
        this.classDefs.push(classDef);
        return this;
    }

    attachClass(nodes: string | ChartNode | (string | ChartNode)[], className: string): this {
        this.classAttachments.push(new ClassAttachment(nodes, className));
        return this;
    }

    addLinkBetween(src: string | ChartNode, dest: string | ChartNode, text?: string): this {
        const srcId = typeof src === 'string' ? src : src.getId();
        const destId = typeof dest === 'string' ? dest : dest.getId();
        this.addLink(new Link(srcId, destId, text));
        return this;
    }

    addLinkStyle(link: number | Link, style: string | LinkStyle): this {
        if (link instanceof Link) {
            link.style = style;
        } else {
            this.positionalLinkStyles.push([link, style]);
        }
        return this;
    }

    addSubgraph(subgraph: Subgraph): this {
        this.subgraphs.push(subgraph);
        return this;
    }
}

class Subgraph extends Chart {
    id?: string;

    toString(): string {
        return this.print('', 0).text;
    }

    getId(): string {
        if (!this.id) {
            this.id = this.title ? this.title.replace(/[^a-zA-Z0-9\-_]+/g, '') : 'subgraph' + Math.floor(Math.random() * 1000000);
        }
        return this.id;
    }

    print(indent: string, linkCount: number): { text: string; nextLinkCount: number } {
        const currentIndent = indent;
        const result: string[] = [];
        result.push(`${currentIndent}subgraph ${this.getId()} [${this.title || ''}]`);
        result.push(`${currentIndent}  direction ${this.direction}`);
        const body = this.printBody(currentIndent + '  ', linkCount);
        result.push(body.text);
        result.push(`${indent}end`);
        return { text: result.join('\n'), nextLinkCount: body.nextLinkCount };
    }
}

interface ParseState {
    nextLinkIndex: number;
    linksByIndex: Map<number, Link>;
    lastParsedLinkIndex?: number;
}

function parseFlowchart(input: string): Chart {
    const lines = input.replace(/\r\n/g, '\n').split('\n');
    let index = 0;
    let title: string | undefined;

    while (index < lines.length && lines[index].trim() === '') {
        index += 1;
    }

    if (index < lines.length && lines[index].trim() === '---') {
        index += 1;
        while (index < lines.length && lines[index].trim() !== '---') {
            const line = lines[index].trim();
            const titleMatch = line.match(/^title:\s*(.*)$/);
            if (titleMatch) {
                title = titleMatch[1];
            }
            index += 1;
        }
        if (index >= lines.length || lines[index].trim() !== '---') {
            throw new Error('Invalid mermaid frontmatter: missing closing ---');
        }
        index += 1;
    }

    while (index < lines.length && lines[index].trim() === '') {
        index += 1;
    }

    if (index >= lines.length) {
        throw new Error('Invalid mermaid flowchart: missing flowchart declaration');
    }

    const header = lines[index].trim();
    const headerMatch = header.match(/^flowchart\s+(LR|TD|TB|RL|BT)$/);
    if (!headerMatch) {
        throw new Error(`Invalid flowchart declaration: "${header}"`);
    }
    const chart = new Chart(title, headerMatch[1] as ChartDir);
    index += 1;

    const state: ParseState = {
        nextLinkIndex: 0,
        linksByIndex: new Map<number, Link>()
    };
    const result = parseChartBody(lines, index, chart, state, false);
    if (result.foundEndToken) {
        throw new Error('Unexpected "end" at root level');
    }
    return chart;
}

function parseChartBody(
    lines: string[],
    startIndex: number,
    chart: Chart,
    state: ParseState,
    stopOnEnd: boolean
): { nextIndex: number; foundEndToken: boolean } {
    let index = startIndex;
    let lastStatementWasLink = false;

    while (index < lines.length) {
        const line = lines[index].trim();
        if (!line) {
            index += 1;
            continue;
        }

        if (line === 'end') {
            if (!stopOnEnd) {
                return { nextIndex: index + 1, foundEndToken: true };
            }
            return { nextIndex: index + 1, foundEndToken: true };
        }

        const subgraphMatch = line.match(/^subgraph\s+([^\s\[]+)\s*(?:\[(.*)\])?$/);
        if (subgraphMatch) {
            const subgraphId = subgraphMatch[1];
            const subgraphTitle = subgraphMatch[2] ?? '';
            const subgraph = new Subgraph(subgraphTitle, ChartDir.TD);
            subgraph.id = subgraphId;
            index += 1;

            while (index < lines.length && lines[index].trim() === '') {
                index += 1;
            }

            if (index >= lines.length) {
                throw new Error(`Subgraph "${subgraphId}" is missing direction and body`);
            }

            const directionLine = lines[index].trim();
            const directionMatch = directionLine.match(/^direction\s+(LR|TD|TB|RL|BT)$/);
            if (!directionMatch) {
                throw new Error(`Subgraph "${subgraphId}" is missing a valid direction line`);
            }
            subgraph.direction = directionMatch[1] as ChartDir;
            index += 1;

            const nestedResult = parseChartBody(lines, index, subgraph, state, true);
            if (!nestedResult.foundEndToken) {
                throw new Error(`Subgraph "${subgraphId}" is missing closing "end"`);
            }
            chart.addSubgraph(subgraph);
            index = nestedResult.nextIndex;
            lastStatementWasLink = false;
            continue;
        }

        const classDefMatch = line.match(/^classDef\s+([^\s]+)\s+(.+)$/);
        if (classDefMatch) {
            const classNames = classDefMatch[1].includes(',')
                ? classDefMatch[1].split(',').map((item) => item.trim())
                : classDefMatch[1];
            chart.addClassDef(new ClassDef(classNames, classDefMatch[2].trim()));
            index += 1;
            lastStatementWasLink = false;
            continue;
        }

        const classAttachmentMatch = line.match(/^class\s+([^\s]+)\s+([^\s;]+);?$/);
        if (classAttachmentMatch) {
            const nodes = classAttachmentMatch[1].split(',').map((item) => item.trim());
            const className = classAttachmentMatch[2];
            chart.attachClass(nodes.length === 1 ? nodes[0] : nodes, className);
            index += 1;
            lastStatementWasLink = false;
            continue;
        }

        const linkStyleMatch = line.match(/^linkStyle\s+(\d+)\s+(.+);?$/);
        if (linkStyleMatch) {
            const linkIndex = Number.parseInt(linkStyleMatch[1], 10);
            const style = linkStyleMatch[2].trim().replace(/;$/, '');
            const link = state.linksByIndex.get(linkIndex);
            if (lastStatementWasLink && state.lastParsedLinkIndex === linkIndex && link && !link.style) {
                link.style = style;
            } else {
                chart.addLinkStyle(linkIndex, style);
            }
            index += 1;
            lastStatementWasLink = false;
            continue;
        }

        const linkMatch = line.match(/^([^\s]+)\s+(-->|---|~~~)\s*(?:\|([^|]+)\|)?\s*([^\s]+)$/);
        if (linkMatch) {
            const src = linkMatch[1];
            const type = linkMatch[2] as LinkType;
            const text = linkMatch[3];
            const dest = linkMatch[4];
            const link = new Link(src, dest, text, type);
            chart.addLink(link);
            state.linksByIndex.set(state.nextLinkIndex, link);
            state.lastParsedLinkIndex = state.nextLinkIndex;
            state.nextLinkIndex += 1;
            index += 1;
            lastStatementWasLink = true;
            continue;
        }

        const node = parseNodeLine(line);
        if (node) {
            chart.addNode(node);
            index += 1;
            lastStatementWasLink = false;
            continue;
        }

        throw new Error(`Unsupported mermaid line: "${line}"`);
    }

    return { nextIndex: index, foundEndToken: false };
}

function parseNodeLine(line: string): ChartNode | null {
    let nodeContent = line;
    let className: string | undefined;
    const classSeparator = line.lastIndexOf(':::');
    if (classSeparator >= 0) {
        nodeContent = line.slice(0, classSeparator);
        className = line.slice(classSeparator + 3).trim();
        if (!className) {
            return null;
        }
    }
    const idMatch = nodeContent.match(/^([a-zA-Z0-9\-_!#$]+)(.+)$/);
    if (!idMatch) {
        return null;
    }

    const id = idMatch[1];
    const rest = idMatch[2];

    const shapeCandidates: Array<{ shape: NodeShape; regex: RegExp }> = [
        { shape: NodeShape.HEXAGON, regex: /^\{\{([\s\S]*)\}\}$/ },
        { shape: NodeShape.CIRCLE, regex: /^\(\(([\s\S]*)\)\)$/ },
        { shape: NodeShape.SUBROUTINE, regex: /^\[\[([\s\S]*)\]\]$/ },
        { shape: NodeShape.CYLINDER, regex: /^\[\(([\s\S]*)\)\]$/ },
        { shape: NodeShape.STADIUM, regex: /^\(\[([\s\S]*)\]\)$/ },
        { shape: NodeShape.RHOMBUS, regex: /^\{([\s\S]*)\}$/ },
        { shape: NodeShape.RECT_ROUND, regex: /^\(([\s\S]*)\)$/ },
        { shape: NodeShape.ASSYMETRIC, regex: /^>([\s\S]*)\]$/ }
    ];

    for (const candidate of shapeCandidates) {
        const match = rest.match(candidate.regex);
        if (match) {
            return new ChartNode(match[1], candidate.shape, id, className);
        }
    }

    return null;
}

export { Chart, ChartNode, Link, LinkType, LinkStyle, NodeStyle, NodeShape, ChartDir, Subgraph, ClassDef, ClassAttachment, parseFlowchart };
