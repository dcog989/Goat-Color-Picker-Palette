// Color name list module types
declare module 'color-name-list' {
    export interface ColorName {
        name: string;
        hex: string;
    }
    export const colornames: ColorName[];
    export default colornames;
}

// Vite ?worker imports — each resolves to a Worker constructor
declare module '*?worker' {
    const Worker: new () => Worker;
    export default Worker;
}
