type ButtonProps = {
    children: React.ReactNode;
    type?: "button" | "submit";
};

export function Button({ children, type = "button" }: ButtonProps) {
    return (
        <button
            type={type}
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
            {children}
        </button>
    );
}