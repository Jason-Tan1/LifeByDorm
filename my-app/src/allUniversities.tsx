import NavBar from './NavBarPages/navbar';
import Footer from './homepage/footer';
import './allUniversities.css';

function AllUniversities() {
  return (
    <div className="all-universities-page">
      <NavBar />
      <div className="all-universities-content">
        <h1>University List</h1>
        <p>Coming soon...</p>
      </div>
      <Footer />
    </div>
  );
}

export default AllUniversities;