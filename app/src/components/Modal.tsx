const ModalButton = ( { buttonFunction, buttonName }: { buttonFunction: any, buttonName: any } ) => {
  return (
    <button onClick={buttonFunction} data-modal-toggle="popup-modal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 mr-2">{buttonName}</button>
  )
}

export default function Modal({ setIsModalOpen, modalContent, modalButtonsFunctions }: { setIsModalOpen: any, modalContent: any, modalButtonsFunctions: any }) {
  console.log(modalButtonsFunctions)
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray75 flex flex-col items-center justify-center m-0">
      <div className="relative w-full h-full max-w-md md:h-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <button onClick={() => setIsModalOpen(false)} type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-toggle="popup-modal">
                  <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  <span className="sr-only">Close modal</span>
              </button>
              <div className="p-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="mx-auto mb-4 text-gray-400 w-14 h-14 dark:text-gray-200" fill="currentColor" stroke="currentColor" viewBox="0 0 512 512"><path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
                  <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">{modalContent}</h3>
                  {modalButtonsFunctions.map((x:any, i:any) => <ModalButton buttonFunction={x[0]} buttonName={x[1]} />)}
              </div>
          </div>
      </div>
  </div>
  );
}