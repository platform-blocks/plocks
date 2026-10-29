import { Badge, Block, TreeSelect } from '@plocks/ui';

const data = [
  {
    id: 'fruit',
    label: 'Fruit',
    children: [
      { id: 'apple', label: 'Apple' },
      { id: 'banana', label: 'Banana' },
    ],
  },
  { id: 'vegetable', label: 'Vegetable', children: [{ id: 'carrot', label: 'Carrot' }] },
];
export function Demo() {
  return (
    <Block fullWidth>
      <TreeSelect
        label="Food"
        data={data}
        mode="multiple"
        defaultValue={['apple', 'carrot']}
        renderPill={(node, { remove, disabled }) => (
          <Badge key={node.id} variant="light" onRemove={remove} disabled={disabled}>
            {node.label}
          </Badge>
        )}
      />
    </Block>
  );
}
