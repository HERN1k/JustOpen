// Developed by Hirnyk Vlad (HERN1k)

import type { LayoutProps } from "../../../system/core/types";

export const index = ({ title, renderSlot, lang = "en" }: LayoutProps) => {
    return (
        <html lang={lang}>
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title}</title>
                {renderSlot('head')} 
            </head>
            <body>
                <header>{renderSlot('header')}</header>
                <main>{renderSlot('main')}</main>
                <footer>{renderSlot('footer')}</footer>
            </body>
        </html>
    );
};