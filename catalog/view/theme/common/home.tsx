// Developed by Hirnyk Vlad (HERN1k)

import type { IPageProps } from "../../../../system/core/types";

export const index = ({ get }: IPageProps) => {
    return (
        <>
            <header dangerouslySetInnerHTML={{ __html: get('header') }} />
            <main><h2>Home page</h2></main>
            <footer dangerouslySetInnerHTML={{ __html: get('footer') }} />
        </>
    );
};