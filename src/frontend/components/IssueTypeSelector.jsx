import React from 'react';
import { Box, Button, Heading, Inline, Stack, Text, Image, icon } from '@forge/react';

const IssueTypeItem = ({ type, onClick, isSelected }) => (
    <Box
        onClick={() => onClick(type.id)}
        padding="space.100"
        xcss={{
            backgroundColor: 'color.background.accent.blue.subtler',
            borderColor: 'color.border',
            borderWidth: 'border.width',
            borderStyle: 'solid',
            borderRadius: 'border.radius',
            cursor: 'pointer',
            ':hover': {
                backgroundColor: 'color.background.accent.blue.subtle',
            },
        }}
    >
        <Inline space="space.100" alignBlock="center">
            {/* Simulation of a checkbox using an icon or image would be ideal, 
          but simpler to just show the content for now. 
          The user screenshot had checkboxes, let's try to mimick with a simple box or icon if possible.
          Since we don't have a check icon handy without importing specific icons, 
          we'll trust the visual cue of the list position for now. 
          Actually, let's use a simple unicode check for visual parity if we can't load icons easily.
      */}
            <Text>☑</Text>
            {type.iconUrl && (
                <Image src={type.iconUrl} alt={type.name} size="xsmall" />
            )}
            <Text>{type.name}</Text>
        </Inline>
    </Box>
);

export const IssueTypeSelector = ({ allTypes, selectedIds, onChange }) => {
    const selectedTypes = allTypes.filter((t) => selectedIds.includes(t.id));
    const availableTypes = allTypes.filter((t) => !selectedIds.includes(t.id));

    const handleAdd = (id) => {
        onChange([...selectedIds, id]);
    };

    const handleRemove = (id) => {
        onChange(selectedIds.filter((currentId) => currentId !== id));
    };

    const handleAddAll = () => {
        onChange(allTypes.map((t) => t.id));
    };

    const handleRemoveAll = () => {
        onChange([]);
    };

    return (
        <Inline space="space.400" alignBlock="start">
            {/* Left Column: Current Scheme */}
            <Stack space="space.100" grow="fill">
                <Heading size="small">Issue Types for Current Scheme</Heading>
                <Button appearance="link" onClick={handleRemoveAll} spacing="none">
                    Remove all
                </Button>
                <Stack space="space.050">
                    {selectedTypes.length === 0 && <Text>No issue types selected</Text>}
                    {selectedTypes.map((type) => (
                        <IssueTypeItem
                            key={type.id}
                            type={type}
                            onClick={handleRemove}
                            isSelected={true}
                        />
                    ))}
                </Stack>
            </Stack>

            {/* Right Column: Available Types */}
            <Stack space="space.100" grow="fill">
                <Heading size="small">Available Issue Types</Heading>
                <Button appearance="link" onClick={handleAddAll} spacing="none">
                    Add all
                </Button>
                <Stack space="space.050">
                    {availableTypes.length === 0 && <Text>All issue types selected</Text>}
                    {availableTypes.map((type) => (
                        <IssueTypeItem
                            key={type.id}
                            type={type}
                            onClick={handleAdd}
                            isSelected={false}
                        />
                    ))}
                </Stack>
            </Stack>
        </Inline>
    );
};
