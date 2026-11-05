import logo from "../assets/zwitscher.webp";

const Header = () => {
  return (
    <header>
      <div className="navbar flex items-center justify-center rounded-b-sm bg-[#85C8F2]">
        <div>
          <img src={logo} className="h-12 w-auto" />
        </div>
      </div>
    </header>
  );
};

export default Header;
