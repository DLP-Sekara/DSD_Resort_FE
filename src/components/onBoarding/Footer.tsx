const Footer = () => {
  return (
    <footer className="relative z-10 flex w-full flex-col items-center gap-3 px-4 pb-0">
      <div className="relative mt-[-1.00px] w-fit text-center font-['Inter',Helvetica] text-xs font-normal leading-3 tracking-[0] text-[#3f3f3f] lg:text-sm">
        ©{' '}
        <span className="font-['DM_Sans',Helvetica]">
          2026 Ocean View Resort-All rights reserved
        </span>
      </div>

      <div className="relative w-fit text-center font-['Outfit',Helvetica] text-xs font-normal leading-[14px] tracking-[0] sm:text-sm lg:text-base">
        <a
          href="/user-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0168ff] underline"
        >
          View User Guide
        </a>
      </div>
    </footer>
  );
};

export default Footer;
