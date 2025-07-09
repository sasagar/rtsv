# Real-time Survey Tool

This is a real-time audience reaction tool built with Next.js, Supabase, and Socket.IO.

## Features

- **Real-time updates:** Questions and results are updated in real-time using Socket.IO.
- **Multiple question types:** Supports multiple-choice, multiple-select, and free-text questions.
- **Presenter view:** A dedicated view for presenters to display questions and results to the audience.
- **Admin view:** A dedicated view for administrators to manage events and questions.
- **Audience view:** A dedicated view for audience members to answer questions.
- **Invite-based User Registration:** User registration for administrators requires an invite code, ensuring controlled access.
- **Presenter Screen Customization:** Administrators can customize the background and text colors of the presenter screen. Picked answers automatically adjust their text color for optimal visibility.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Backend:** [Supabase](https://supabase.io/)
- **Real-time:** [Socket.IO](https://socket.io/)
- **UI:** [Radix UI](https://www.radix-ui.com/) and [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Documentation:** [TypeDoc](https://typedoc.org/)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm
- Supabase account

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/rtsv.git
   cd rtsv
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root of the project and add your Supabase URL and anon key. You can use the `.env.local.example` file as a template.

   ```
   NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
   ```

4. **Set up Supabase database:**

   Run the SQL migration scripts located in the `supabase/migrations` directory in your Supabase project. You can use the Supabase CLI for this:

   ```bash
   # Link your local project to your Supabase project (replace YOUR_PROJECT_REF)
   supabase link --project-ref YOUR_PROJECT_REF

   # Push migrations to your Supabase database
   supabase db push
   ```

   Alternatively, for local development, you can run Supabase locally using the Supabase CLI.

   1.  **Install Supabase CLI:**
       If you haven't already, install the Supabase CLI.
       ```bash
       brew install supabase/supabase/supabase # macOS
       # or follow instructions for your OS: https://supabase.com/docs/guides/cli/getting-started#install-the-cli
       ```

   2.  **Start local Supabase services:**
       Navigate to the `supabase` directory and start the local services.
       ```bash
       cd supabase
       supabase start
       ```
       This will output the local Supabase URL and anon key. Update your `.env.local` file with these values.

   3.  **Apply migrations to local Supabase:**
       From the project root, push your migrations to the local Supabase instance.
       ```bash
       supabase db push
       ```

   4.  **Seed local database (Optional):**
       If you have a `seed.sql` file (e.g., `supabase/seed.sql`) for initial data, you can run it.
       ```bash
       supabase db seed
       ```

   **Note:** Ensure you have created the `invite_codes` table and the `signup_with_invite` function as defined in the migrations. Also, the `events` table now includes `background_color` and `text_color` columns. For initial invite codes, you will need to manually insert them into the `invite_codes` table via the Supabase dashboard.

5. **Run the development server:**

   ```bash
   npm run dev
   ```

   By default, the application runs on port `3000`. You can change this by setting the `PORT` environment variable:
   ```bash
   PORT=4000 npm run dev
   ```
   If you change the port, remember to update the `proxy_pass` directive in your Nginx configuration accordingly.

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

- **Admin Dashboard:** `/admin`
  - Requires user login with a valid invite code for registration.
  - Only logged-in users can create and manage events.
  - **Display Settings:** Customize the background and text colors for the presenter screen.
- **Presenter View:** `/presenter/[eventId]`
  - Publicly accessible. Displays real-time results for a specific event.
- **Audience View:** `/event/[accessCode]`
  - Publicly accessible. Allows participants to answer questions for a specific event.

## Invite Code Management (for System Administrators)

To allow new users to register as administrators, you need to issue invite codes. Currently, this is done manually:

1.  Go to your Supabase project dashboard.
2.  Navigate to the `Table Editor`.
3.  Select the `invite_codes` table.
4.  Insert a new row with the following details:
    - `code`: A unique string (e.g., `MYSECRETINVITE`)
    - `max_uses`: The maximum number of times this code can be used (e.g., `1` for single use, `0` for unlimited)
    - `expires_at`: A future timestamp when the code will expire (e.g., `2025-12-31T23:59:59Z`)

Users can then use this `code` during the sign-up process.

## Documentation Generation

To generate the API documentation from JSDoc comments:

```bash
npm run docs
```

The generated HTML documentation will be available in the `./docs` directory. Open `docs/index.html` in your browser to view it.

## Live Documentation

The latest API documentation is automatically deployed and available at [https://sasagar.github.io/rtsv/](https://sasagar.github.io/rtsv/).
