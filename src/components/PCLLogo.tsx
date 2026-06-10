const PCLLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
        <span className="text-primary-foreground text-xl font-bold tracking-wide">Ebop</span>
      </div>
    </div>
  );
};

export default PCLLogo;
