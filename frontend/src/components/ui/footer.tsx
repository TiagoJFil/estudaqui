export function Footer() {
    return (
        <footer className="bg-[#232946] text-gray-100 py-8 border-none w-full mt-0">
            <div className="container mx-auto text-center text-lg font-semibold">
                <p>&copy; {new Date().getFullYear()} Studaki. All rights reserved.</p>
                <p className="text-base font-normal mt-2">Powered by AI</p>
            </div>
        </footer>
    )
}