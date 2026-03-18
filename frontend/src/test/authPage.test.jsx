import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../pages/LoginPage";
import { useAuthStore } from "../store/authStore";

const login = vi.fn();
const register = vi.fn();
const getMe = vi.fn();

vi.mock("../api", () => ({
    login: (...args) => login(...args),
    register: (...args) => register(...args),
    getMe: (...args) => getMe(...args),
}));

function renderPage(mode) {
    return render(
        <MemoryRouter>
            <LoginPage mode={mode} />
        </MemoryRouter>,
    );
}

describe("LoginPage", () => {
    beforeEach(() => {
        login.mockReset();
        register.mockReset();
        getMe.mockReset();
        useAuthStore.setState({ me: null, bootstrapped: true });
    });

    afterEach(() => {
        cleanup();
    });

    it("validates registration fields before submit", async () => {
        renderPage("register");

        fireEvent.click(screen.getByRole("button", { name: /create workspace access/i }));

        expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
        expect(register).not.toHaveBeenCalled();
    });

    it("renders login mode without registration-only fields", () => {
        renderPage("login");

        expect(screen.getByRole("button", { name: /authenticate session/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/return to the command center/i).length).toBeGreaterThan(0);
    });
});
