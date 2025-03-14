import TriskelIcon from "./triskel.svg";

const SplashScreen = () => {
    return (
        <div
            className=" h-full w-full flex items-center justify-center flex-col"
            style={{ backgroundColor: "var(--vscode-sideBar-background)" }}
        >
            <div className="aspect-square w-1/2 h-auto" style={{ color: "var(--vscode-editor-background)" }}>
                <TriskelIcon className="h-full w-full" />
            </div>

            <p style={{ opacity: 0.3 }}>Triskel - Made with ❤️ in France</p>
        </div>
    );
};

export default SplashScreen;
