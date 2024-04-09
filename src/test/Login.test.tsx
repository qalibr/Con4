import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, vi } from "vitest";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginCard } from "@/confourComponents/auth/login-card.tsx";

// Test to make sure Login works as expected.
describe("Login", () => {
  test("Login form should be in the document", () => {
    const handleLoginSuccess = vi.fn();
    const handleCancel = vi.fn();

    /*
     * The way our app works is it is wrapped in an Outlet to handle routing,
     * here we render the route to the LoginCard. */
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <LoginCard
                onCancel={handleCancel}
                onLoginSuccess={handleLoginSuccess}
              />
            }
          />
        </Routes>
      </BrowserRouter>,
    );

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    // User actions
    fireEvent.change(emailInput, { target: { value: "test_user@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(submitButton);
  });
});
