# Altay Shop

**URL**: https://altay-shop.vercel.app/

This is a simple e-commerce web application developed for the CENG495 Cloud Computing course. It allows users to browse and interact with products, and includes full admin capabilities for managing users and items. The application is deployed to Vercel and uses MongoDB Atlas as the database.

## Technologies Used

* **Backend**: Node.js
* **Frontend**: HTML, CSS, JavaScript
* **Database**: MongoDB Atlas
* **Authentication**: JWT-based token authentication and role-based authorization
* **Cloud**: Vercel

### Backend

The backend of the application is built using Node.js and hosted on Vercel. All API endpoints are located under the `api/` directory. The backend includes the following features:

- Uses **MongoDB Atlas** as the database.
- Implements **JWT-based authentication**, with helper functions in `lib/auth.js`.
- Authorization is enforced:
  - Only admin users can add new items or create new users.
  - Registered users can rate and review items.
- When a **user is deleted**:
  - All their reviews and ratings are removed from items.
  - Affected items recalculate their average rating.
- When an **item is deleted**:
  - All related reviews and ratings are removed from the users who submitted them.
  - Those users' average rating is recalculated accordingly.

#### API Endpoints:

- `POST /api/register`: Registers a new user. Accepts `username`, `password`, and optionally an `role` flag (only permitted when the request comes from an existing admin).

- `POST /api/login`: Authenticates the user by checking their credentials. If successful, returns a JWT token along with the user's role. Else, login is rejected.

- `GET /api/items`: Returns a complete list of all items in the database, including title, description, price, ratings, and reviews. Publicly accessible with no authentication required.

- `POST /api/addItem`: Adds a new item to the store. Only accessible by admins. The request must include valid admin credentials and item details such as `title`, `description`, and `price`.

- `POST /api/rateItem`: Allows a logged-in user to rate a specific item. Accepts an `itemId` and a numeric `rating` (between 1-10). After rating:
  - The item’s overall average rating is updated.
  - The user’s personal rating statistics are also recalculated.

- `POST /api/reviewItem`: Submits a written comment or review on a product. Requires `itemId` and `comment` fields. The comment is stored under both the item and the user’s review history.

- `GET /api/usersList`: Returns a list of all registered users. Admin-only. Useful for populating user management dashboards in the admin panel.

- `GET /api/userInfo`: Returns details about the currently authenticated user (based on the JWT provided). Includes username, admin status, and a list of their reviews and ratings.

- `DELETE /api/deleteItem`: Removes a product from the store. Requires admin credentials and the `itemId`. Triggers cleanup operations to:
  - Remove the item itself.
  - Remove associated ratings and reviews from all users.
  - Recalculate affected users’ rating averages.

- `DELETE /api/deleteUser`: Removes a user account. Admin-only operation. Deletes all of the user's ratings and reviews across the platform, and updates any related item data.

- `GET /api/ping`: Simple health-check endpoint.

### Frontend

The frontend is built using plain HTML, CSS, and JavaScript without any frameworks or libraries. It is structured under the `public/` directory and optimized for desktop use.

#### Page Structure:

- `index.html`: Serves as the landing page of the application. On load, it fetches the list of products via `GET /api/items` and renders them dynamically. Provides filtering by category and buttons to log in or register.

- `login.html`: Displays a form where users input their credentials. On submit, the data is sent to `/api/login`. If successful:
  - JWT token is saved to localStorage.
  - User is redirected to the homepage.
  - Errors are displayed if login fails.

- `register.html`: Allows new users to sign up. Includes fields for username and password. Sends data to `/api/register`.

- `product.html`:  Displays details for a single product. The page is loaded with a query parameter (`?id=...`) used to identify the product. Shows product description, price, current reviews, and average rating. Logged-in users can:
  - Submit a rating via `/api/rateItem`.
  - Submit a review via `/api/reviewItem`.

- `profile.html`:  
  Shows a logged-in user's information, including:
  - Username.
  - A list of their reviews/rating and average rating.
  - Data is retrieved via `/api/userInfo`.

- `admin.html`:  
  Visible only to admin users. Provides:
  - A form to add new products using `/api/items`.
  - A form to register new users using `/api/register`.

### Cloud

The project is deployed on **Vercel**, connected directly to **GitHub** for automatic deployments.  
Sensitive data like `JWT_SECRET` and `MONGODB_URI` are set as environment variables in Vercel.

## Users and Roles

The system has three types of users: **Guest (Not Logged In)**, **User**, and **Admin**.

- **Guest (Not Logged In)**:
  - Can browse all available products on the homepage.
  - Can access the registration page and create a new account.
  - Cannot log in, rate products, or leave reviews.

- **User**:
  - Has all the permissions of a guest.
  - Can rate and review items.
  - Can view their own profile with rating and review history.

- **Admin**:
  - Has all the permissions of a regular user.
  - Can add new products and users.
  - Can delete any product or user.
  - Can view the list of all registered users.

### Registered Credentials
The information of the users registered in the system is written below. The ones on the left of "-" are the usernames and the ones on the right are the passwords. All users can log in by clicking the button on the top-right side of the main page.

**User**:
- bob - bob
- alice - alice
- charlie - charlie

**Admin**:
- admin01 - adminpass

## Technology Choices and Design Decisions

This section explains the rationale behind the technologies, languages, and design strategies used in this project, as required by the assignment.

- **JavaScript (Node.js)**:
  - I chose **JavaScript** for both frontend and backend to keep a **single language environment**, making development faster and reducing context-switching between languages.
  - On the backend, **Node.js** offers excellent performance for I/O-bound web applications. It integrates seamlessly with Vercel's Serverless Functions and handles asynchronous operations effectively.
  - On the frontend, JavaScript is the default choice for web interactivity, enabling direct manipulation of the DOM.

- **No Frameworks (Vanilla HTML/CSS/JS)**:
  - This choice was aligned with the assignment’s focus on functionality over complexity and allowed full control over the structure and behavior of each page without framework abstraction.

- **JWT for Authentication**:
  - I used **JSON Web Tokens** to implement stateless and secure authentication. After login, users receive a token that is stored in `localStorage` and used for subsequent requests to protected endpoints.
  - This method is lightweight, secure, and well-suited for serverless environments where session state is not easily maintained.

- **Minimal Dependencies**:  
  I used only a few npm packages in this project. This makes the app more secure and keeps it simple. 

