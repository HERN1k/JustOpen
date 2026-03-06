// Developed by Hirnyk Vlad (HERN1k)

import { HTTPS_BASE_URL } from "../../../config";
import { StringHelper } from "../../../system/helper/string";
import type { LayoutProps } from "../../../system/core/types";

export const index = ({ title = "JustOpen 0.0.1", lang = "en", content = "", css = [], js = [] }: LayoutProps) => {
    return (
        <html lang={lang}>
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title}</title>
                <base href={StringHelper.trimByChar(HTTPS_BASE_URL, '/') + '/'} />
                {css.map((css, index) => <link key={index} rel="stylesheet" href={css} />)}
            </head>
            <body dangerouslySetInnerHTML={{ __html: content }} />
            {js.map((js, index) => <script key={index} src={js} defer />)}
        </html>
    );
};