import { render, screen } from '@testing-library/react';
import App from "./App.tsx";

it("Should have 'Hello, World'", () => {
        render(<App/>)
        const message = screen.queryByText(/Hello World/i)
        expect(message).toBeVisible();
});