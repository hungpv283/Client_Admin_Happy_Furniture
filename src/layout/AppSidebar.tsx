"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  FileIcon,
  ChatIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <ListIcon />,
    name: "Danh mục",
    subItems: [
      { name: "Danh sách", path: "/categories" },
      { name: "Thêm mới", path: "/categories/create" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Sản phẩm",
    subItems: [
      { name: "Danh sách", path: "/products" },
      { name: "Thêm mới", path: "/products/create" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Chất liệu",
    subItems: [
      { name: "Danh sách", path: "/materials" },
      { name: "Thêm mới", path: "/materials/create" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Assemblies",
    subItems: [
      { name: "Danh sách", path: "/assemblies" },
      { name: "Thêm mới", path: "/assemblies/create" },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Tin tức",
    subItems: [
      { name: "Danh sách", path: "/news" },
      { name: "Thêm mới", path: "/news/create" },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Chứng chỉ",
    subItems: [
      { name: "Danh sách", path: "/certificates" },
      { name: "Thêm mới", path: "/certificates/create" },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Thông tin công ty",
    subItems: [
      { name: "Danh sách", path: "/company-info" },
      { name: "Thêm mới", path: "/company-info/create" },
    ],
  },
  {
    icon: <ChatIcon />,
    name: "Liên hệ",
    path: "/contacts",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });
    if (!submenuMatched) {
      setTimeout(() => {
        setOpenSubmenu(null);
      }, 0);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
            >
              <span
                className={
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
              Happy Furniture
            </span>
          ) : (
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
              HF
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi trang quản trị? Cần đăng nhập lại để tiếp tục."
        confirmLabel="Đăng xuất"
        cancelLabel="Ở lại"
        variant="warning"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      {/* Logout */}
      <div className="pb-6 border-t border-gray-200 dark:border-gray-800 pt-4">
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mb-3 px-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          className={`menu-item group menu-item-inactive w-full ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
            }`}
        >
          <span className="menu-item-icon-inactive">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </span>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="menu-item-text">Đăng xuất</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
