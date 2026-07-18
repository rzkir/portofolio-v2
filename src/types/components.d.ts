//============================ Button ============================//
interface ButtonProps {
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "ghost" | "icon" | "outline" | "quick-reply";
    size?: "sm" | "md" | "lg" | "icon";
    id?: string;
    disabled?: boolean;
    class?: string;
    "aria-label"?: string;
    "aria-expanded"?: "true" | "false";
    "aria-haspopup"?: "menu" | "listbox" | boolean;
}

//============================ Alert Dialog ============================//
interface AlertDialogProps {
    id: string;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loadingLabel?: string;
    class?: string;
}

//============================ Aside ============================//
interface AsideProps {
    class?: string;
    homeHref?: string;
}

//============================ Card ============================//
interface CardProps {
    no?: string;
    title: string;
    tag?: string;
    year?: string;
    description?: string;
    image?: ImageMetadata | string;
    href?: string;
    external?: boolean;
    variant?: "link" | "select" | "surface";
    category?: string;
    categoryLabel?: string;
    prompt?: string;
}

interface Props extends CardProps {
    class?: string;
}

//============================ Input ============================//
interface InputProps {
    label: string;
    id: string;
    name: string;
    type?: string;
    placeholder?: string;
    maxlength?: number;
    required?: boolean;
    class?: string;
    inputClass?: string;
}

//============================ Select ============================//
interface SelectOption {
    value: string;
    label: string;
    selected?: boolean;
}

interface SelectProps {
    label: string;
    id: string;
    name: string;
    options: SelectOption[];
    required?: boolean;
    class?: string;
    selectClass?: string;
}

interface Props extends SelectProps { }

//============================ History ============================//
interface HistoryProps {
    storageKey: string;
    title?: string;
    class?: string;
    newChatLabel?: string;
    searchPlaceholder?: string;
    openLabel?: string;
    collapseLabel?: string;
    closeLabel?: string;
    panelLabel?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    emptySearchTitle?: string;
    emptySearchDescription?: string;
}

//============================ Empaty ============================//
interface EmpatyProps {
    title?: string;
    description?: string;
    class?: string;
}

//============================ Sidebar ============================//
interface SidebarNavItem {
    id: string;
    href: string;
    label: string;
    icon:
    | "agent"
    | "chat"
    | "history"
    | "folder"
    | "seo"
    | "marketing"
    | "finance"
    | "health"
    | "trivia"
    | "academia"
    | "programming"
    | "technology"
    | "science"
    | "translation"
    | "legal";
    active?: boolean;
}

interface SidebarLabels {
    home?: string;
    backHome?: string;
    agentNavigation?: string;
    userAlt?: string;
}

interface SidebarProps {
    class?: string;
    items?: SidebarNavItem[];
    homeHref?: string;
    labels?: SidebarLabels;
}

//============================ Tabs ============================//
interface TabItem {
    id: string;
    label: string;
}

interface TabsProps {
    id: string;
    tabs: TabItem[];
    defaultTab?: string;
    class?: string;
    listClass?: string;
    panelsClass?: string;
}

//============================ Textarea ============================//
interface TextareaProps {
    label: string;
    id: string;
    name: string;
    placeholder?: string;
    maxlength?: number;
    rows?: number;
    required?: boolean;
    class?: string;
    textareaClass?: string;
    variant?: "default" | "prompt" | "chat";
    sendLabel?: string;
}
