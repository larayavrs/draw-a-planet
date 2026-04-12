-- Default systems
insert into public.systems (name, slug, star_type, description, is_default, max_planets)
values (
  'Alpha Solaris',
  'alpha-solaris',
  'yellow_dwarf',
  'The original system. A warm yellow star holds hundreds of handcrafted worlds in orbit.',
  true,
  500
);

insert into public.systems (name, slug, star_type, description, max_planets)
values
  (
    'Crimson Nebula',
    'crimson-nebula',
    'red_dwarf',
    'A dim red star surrounded by volcanic and icy worlds born from artist imagination.',
    300
  ),
  (
    'Void Station',
    'void-station',
    'neutron',
    'A neutron star pulsar. Only the boldest and most vivid planets survive here.',
    150
  );
