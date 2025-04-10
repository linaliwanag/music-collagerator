declare module 'dom-to-image' {
    interface DomToImageOptions {
        quality?: number;
        width?: number;
        height?: number;
        bgcolor?: string;
        style?: Partial<CSSStyleDeclaration>;
        filter?: (node: Node) => boolean;
    }

    export function toPng(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
    export function toJpeg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
}