import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }: { children: any }) => {
  return (
    // Make classname such that content is centered and not full width
    // Also make sure that the footer is always at the bottom of the page
    <div className="text-center p-4">
      <div className="flex flex-col justify-self align-items rounded-2xl px-4 pb-8 pt-6 mt-[40px] md:mt-[160px] bg-white shadow-xl border border-slate-300 max-w-[700px] mx-auto">
        <Header />
        <main className="max-w-lg center mx-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
