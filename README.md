# Realty Return Calculator

This project is a web application designed to help users calculate returns on realty investments, manage cash flows, and analyze potential profitability. It features interest calculation, CSV data import/export, and a cash flow table.

## Project Overview

The Realty Return Calculator provides tools for:
- Inputting and managing payment schedules and rental income.
- Calculating monthly interest on outstanding balances.
- Importing cash flow data from CSV files.
- Exporting cash flow data to CSV files.
- Viewing a detailed table of all cash flow entries (payments, returns, interest).
- Analyzing overall project cash flow (future feature).

## Technologies Used

This project is built with:

- **Vite**: For fast frontend build tooling.
- **React**: For building the user interface.
- **TypeScript**: For static typing and improved code quality.
- **shadcn-ui**: For UI components.
- **Tailwind CSS**: For utility-first CSS styling.
- **Lucide React**: For icons.
- **date-fns**: For date utility functions.

## Features

- **Cash Flow Management**: Add, edit, and delete payment and return entries.
- **Interest Calculation**: Automatically calculate and add monthly interest payments based on an annual interest rate and cash flow timing.
- **CSV Import/Export**: 
    - Import cash flow data from a CSV file (format: `Date (MMM-YYYY), Amount (Number), Description (String), Type ('payment' or 'return', optional)`).
    - Export the current cash flow table to a CSV file.
- **Dynamic Table View**: Displays all payments, returns, and calculated interest chronologically, with running balances.
- **Responsive Design**: UI adapts to different screen sizes (leveraging Tailwind CSS and shadcn-ui).

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_GIT_URL> # Replace with your project's Git URL
    cd realty-return-calculator
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```
    Or if you prefer yarn:
    ```sh
    yarn install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Or with yarn:
    ```sh
    yarn dev
    ```
    This will start the Vite development server, typically on `http://localhost:5173`.

## Project Structure (Key Directories)

-   `src/components/`: Contains React components.
    -   `src/components/payments/`: Components specifically related to payment display and interaction.
-   `src/utils/`: Contains utility functions (e.g., `interestCalculator.ts`, `csvExport.ts`).
-   `src/types/`: Contains TypeScript type definitions (e.g., `project.ts`).
-   `src/hooks/`: Custom React hooks (e.g., `use-toast.ts`).
-   `public/`: Static assets.

## Contributing

[Details on how to contribute, if applicable, e.g., coding standards, pull request process.]

## Future Enhancements

- More detailed cash flow analysis and visualization.
- User authentication and data persistence.
- Advanced financial metrics (IRR, NPV).

---

*This README was last updated on May 24, 2025.*
