type PlaceholderPageProps = {
  title: string;
  description: string;
};

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => (
  <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-8 text-center">
    <h2 className="mb-2 text-2xl font-bold text-primary">{title}</h2>
    <p className="max-w-md text-muted-foreground">{description}</p>
  </div>
);

export default PlaceholderPage;
