import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <div className="main-content">
        <Navbar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
