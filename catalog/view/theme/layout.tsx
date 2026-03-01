// Developed by Hirnyk Vlad (HERN1k)

import type { LayoutProps } from "../../../system/core/types";

export const index = ({ title, lang = "en", content }: LayoutProps) => {
    return (
        <html lang={lang}>
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title}</title>
                {/* head */} 
            </head>
            <body dangerouslySetInnerHTML={{ __html: content }} />
        </html>
    );
};