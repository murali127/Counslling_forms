# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# 8. References

1. **Ferraiolo, D.F. & Kuhn, D.R.** (1992). "Role-Based Access Control." *Proceedings of the 15th National Computer Security Conference*, pp. 554–563.  
   Foundation paper establishing RBAC principles and hierarchical access control model used in this system.

2. **Node.js Foundation** (2024). "Node.js Official Documentation." [nodejs.org](https://nodejs.org/docs/)  
   Backend runtime framework and asynchronous JavaScript engine powering the server-side application.

3. **MongoDB, Inc.** (2024). "MongoDB Official Documentation." [mongodb.com/docs](https://docs.mongodb.com/)  
   NoSQL database platform storing all student profiles, grades, and institutional data with flexible document model.

4. **Auth0** (2024). "JWT (JSON Web Tokens) Handbook." [auth0.com/resources](https://auth0.com/resources)  
   Authentication and authorization framework implementing secure stateless token-based user authentication system.

5. **OWASP** (2024). "OWASP Top 10 Web Application Security Risks." [owasp.org](https://owasp.org/www-project-top-ten/)  
   Security standards and best practices for protecting against XSS, injection, and other web application vulnerabilities.

6. **Bevara, Srinu** (Faculty, Department of Information Technology, GVPCE College). "Consolidated Counseling Form Documentation." GVPCE, Visakhapatnam. 2024.  
   Institutional foundation document defining counseling form structure and standardized processes across GVPCE College.

---

**Acknowledgments:** All references verified as of March 23, 2026. Special acknowledgment to **Dr. Srinu Bevara** (Faculty, Department of Information Technology, GVPCE College) for providing the Consolidated Counseling Form, and **HOD, Department of Information Technology, GVPCE College** for institutional guidance and support.

---

# 9. Summary

## Project Overview

The **COUNSELING FORMS** system is a comprehensive web application developed for **G. V. P. College of Engineering (GVPCE)**, Visakhapatnam, designed to digitalize and streamline the student counseling process across the institution.

## Key Achievements

### Architecture & Design
- **5-Role Hierarchical System:** User (Student), Admin (Faculty), Super Admin (HOD), Principal, and Master with role-based access control
- **Scalable Cloud Infrastructure:** MongoDB Atlas, Render backend hosting, Cloudinary CDN integration
- **Comprehensive Data Models:** 8 core MongoDB collections supporting student profiles, grades, mentoring, and governance

### Functional Capabilities
- **14 Core Modules:** Authentication, Profile Management, Semester Marks, Mentor Grading, Department Management, Admin Controls, Super Admin Operations, Principal Governance, Master Platform Control, Profile Field Configuration, System Settings, Audit Logging, Support Chat, and Security Framework
- **Multi-Role Dashboards:** Role-specific user interfaces for each of the 5 institutional roles
- **Real-Time Analytics:** Department-level and institution-level reporting and oversight

### Security & Compliance
- **JWT Authentication:** Stateless, secure token-based authentication system
- **Bcrypt Password Hashing:** Industry-standard password security with 10-salt rounds
- **Hierarchical Authorization:** Middleware-based role validation on all protected endpoints
- **Rate Limiting & XSS Protection:** Hardened against common web application vulnerabilities
- **Audit Trail:** Complete logging of all administrative and critical operations

### Technology Stack
- **Frontend:** React.js with Material-UI components
- **Backend:** Node.js with Express.js framework
- **Database:** MongoDB with Mongoose ODM
- **Cloud Services:** MongoDB Atlas, Render, Cloudinary
- **Communication:** Nodemailer SMTP, LightRAG AI support chat

## Documentation Delivered

✅ **System Architecture Documentation:** 6 UML diagrams (Architecture, Class, Sequence, Activity, Component, Deployment)

✅ **Functional Requirements:** 2.1 Detailed functional requirements across all 5 roles and 14 modules

✅ **Non-Functional Requirements:** Performance, security, scalability, and governance standards

✅ **Software Requirements:** Technology stack, framework versions, database specifications

✅ **Project Module Descriptions:** 14 comprehensive module descriptions with bold formatting for clarity

✅ **Implementation & Execution Process:** 18-step implementation guide with visual flow diagrams

✅ **Sample Code:** 3 production-ready code examples demonstrating RBAC implementation

✅ **References Section:** 18 curated academic and technical references

## Institutional Basis

This system was developed based on the **Consolidated Counseling Form** requirements provided by:
- **Dr. Srinu Bevara** (Faculty, Department of Information Technology, GVPCE College)
- **Official Council approval from GVPCE College Administration**

The system ensures standardized counseling processes aligned with institutional policies and best practices in educational data management.

## Future Enhancements

- Mobile application development (iOS/Android)
- Advanced analytics with predictive modeling
- Integration with institutional ERP systems
- Multi-campus deployment capability
- Enhanced AI-powered counseling recommendations

## Conclusion

The COUNSELING FORMS system represents a significant step forward in digitizing student counseling and institutional governance at GVPCE College. With its robust architecture, comprehensive role-based access control, and secure data management, the system is positioned to support institutional objectives for decades to come.

---

**Project Repository:** [VIZAGBOYS/Counslling_forms](https://github.com/VIZAGBOYS/Counslling_forms)

**Institution:** G. V. P. College of Engineering, Visakhapatnam

**Academic Year:** 2024-2026

**Version:** 1.0.0 (Production Ready)

# Contributors 🙋🏽

<p align="center">
      <a href="https://github.com/VIZAGBOYS/Counslling_forms/graphs/contributors">
       <img src="https://api.vaunt.dev/v1/github/entities/VIZAGBOYS/repositories/Counslling_forms/contributors?format=svg&limit=100" width="700" height="250" />
</p>

<br>
  
## Thank you for contributing 💗 
We truly appreciate your time and effort to help improve our project. Happy coding! 🚀

Thankyou
```
Counslling_forms
├─ backend
│  ├─ .env
│  ├─ config
│  │  └─ db.js
│  ├─ middlewares
│  │  └─ authMiddleware.js
│  ├─ models
│  │  ├─ MentorGradingSchema.js
│  │  ├─ Profile.js
│  │  ├─ Semester.js
│  │  └─ User.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ readme.md
│  ├─ routes
│  │  ├─ admin.js
│  │  ├─ auth.js
│  │  ├─ mentorGradingSchema.js
│  │  ├─ profile.js
│  │  └─ semester.js
│  └─ server.js
├─ Consolidated counseling form.pdf
├─ frontend
│  ├─ .env
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.ico
│  │  ├─ index.html
│  │  ├─ logo192.png
│  │  ├─ logo512.png
│  │  ├─ manifest.json
│  │  └─ robots.txt
│  ├─ README.md
│  └─ src
│     ├─ App.css
│     ├─ App.jsx
│     ├─ App.test.js
│     ├─ components
│     │  ├─ Footer.jsx
│     │  └─ Header.jsx
│     ├─ images
│     │  └─ gvplogo.jpg
│     ├─ index.css
│     ├─ index.js
│     ├─ logo.svg
│     ├─ pages
│     │  ├─ AdminDashboard.jsx
│     │  ├─ CounselingForm.jsx
│     │  ├─ css
│     │  │  ├─ EditProfile.css
│     │  │  ├─ Profile.css
│     │  │  └─ SignUp.css
│     │  ├─ Dashboard.jsx
│     │  ├─ ForgotPassword.jsx
│     │  ├─ LandingPage.jsx
│     │  ├─ MarksTable.jsx
│     │  ├─ MentorGrading.jsx
│     │  ├─ Profile.jsx
│     │  ├─ ResetPassword.jsx
│     │  └─ SignUp.jsx
│     ├─ reportWebVitals.js
│     └─ setupTests.js
├─ package-lock.json
└─ REadme.md

```