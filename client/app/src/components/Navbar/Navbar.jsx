import { useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react'
import {
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { getNavigationConfig } from '../constants/utils'
import { useUser } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const { userType } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // NEW: for right-hand sidebar

  const navLinks = getNavigationConfig(userType ?? 0)

  const handleLogout = () => {
    localStorage.clear(); // or remove only the keys you need
    window.location.href = "/"; // redirect to landing or login page
  };

  // Sidebar links (for logged-in users)
  const sidebarLinks = [
    { name: 'Profile', to: '/profile' },
    { name: 'Sign out', action: handleLogout },
  ]

  return (
    <header className="bg-orange-50">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <a href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
            <img alt="" src="logo.png" className="h-8 w-auto" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>

        {/* Desktop Menu */}
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          {navLinks.map((link) =>
            link.submenus ? (
              <Popover key={link.name} className="relative">
                <PopoverButton className="flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900">
                  {link.name}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-5 flex-none text-gray-400"
                  />
                </PopoverButton>
                <PopoverPanel className="absolute left-1/2 z-10 mt-3 w-56 -translate-x-1/2 rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
                  <div className="p-4 space-y-2">
                    {link.submenus.map((sub) => (
                      <a
                        key={sub.name}
                        href={sub.to}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                </PopoverPanel>
              </Popover>
            ) : (
              <a
                key={link.name}
                href={link.to}
                className="text-sm/6 font-semibold text-gray-900"
              >
                {link.name}
              </a>
            )
          )}
        </PopoverGroup>

        {/* Right-side buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {userType === 'Viewer' ? (
            <a href="/login" className="text-sm/6 font-semibold text-gray-900">
              Sign in <span aria-hidden="true">&rarr;</span>
            </a>
          ) : (
            <button
              type="button"
              aria-label="Open sidebar menu"
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-700 hover:text-gray-900"
            >
              <Bars3Icon className="size-6" />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Nav Menu */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <a href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">TailorHire</span>
              <img alt="" src="logo.png" className="h-8 w-auto" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>

          {/* Dynamic nav links in mobile */}
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navLinks.map((link) =>
                  link.submenus ? (
                    <Disclosure as="div" key={link.name} className="-mx-3">
                      <DisclosureButton className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50">
                        {link.name}
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-5 flex-none group-data-open:rotate-180"
                        />
                      </DisclosureButton>
                      <DisclosurePanel className="mt-1 space-y-1">
                        {link.submenus.map((sub) => (
                          <a
                            key={sub.name}
                            href={sub.to}
                            className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            {sub.name}
                          </a>
                        ))}
                      </DisclosurePanel>
                    </Disclosure>
                  ) : (
                    <a
                      key={link.name}
                      href={link.to}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      {link.name}
                    </a>
                  )
                )}
              </div>

              {/* Mobile Right-hand Sidebar trigger */}
              <div className="py-6">
                {userType === 'Viewer' ? (
                  <a
                    href="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Log in
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Menu
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Sidebar (for logged-in users) */}
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <DialogPanel className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl p-6 rounded-lg transform transition-transform duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2">
              <XMarkIcon className="size-6 text-gray-700" />
            </button>
          </div>
          <div className="space-y-4">
            {sidebarLinks.map((link, idx) =>
              link.action ? (
                <button
                  key={idx}
                  onClick={link.action}
                  className="text-red-500 px-4 py-2 w-full text-left"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={idx}
                  to={link.to}
                  className="block px-4 py-2"
                >
                  {link.name}
                </Link>
              )
            )}
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}

export default Navbar;
