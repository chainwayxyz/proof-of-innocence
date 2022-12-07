import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }: {children:any}) => {
  return (
    // Make classname such that content is centered and not full width
    // Also make sure that the footer is always at the bottom of the page
    <div className='text-center'>
      <Header />
      <main className='max-w-md center mx-auto'>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
