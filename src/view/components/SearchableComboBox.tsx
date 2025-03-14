import React, { useState } from "react";

export interface SearchableComboBoxProps {
    options: string[];
    selected: string | undefined;
    onSelect: (selected: string) => void;
}

const SearchableComboBox = ({ options, selected, onSelect }: SearchableComboBoxProps) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSearchChange = (e: any) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
    };

    const handleOptionSelect = (option: string) => {
        onSelect(option);
        setSearchTerm(option);
        setIsOpen(false);
    };

    const handleBlur = () => {
        setIsOpen(false);
    };

    return (
        <div className="combo-box" onBlur={handleBlur} tabIndex={0}>
            <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search..."
                onFocus={() => setIsOpen(true)}
            />
            <div className="options-list">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                        <div
                            className={"option-item" + (option === selected ? " selected" : "")}
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                        >
                            {option}
                        </div>
                    ))
                ) : (
                    <div>No results found</div>
                )}
            </div>
        </div>
    );
};

export default SearchableComboBox;
