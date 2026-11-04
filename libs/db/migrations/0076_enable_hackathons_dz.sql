-- Turn hackathons on in Algeria (B-LCH-06). Every hackathon screen, server function and notice reads this flag.
UPDATE markets
SET feature_flags = json_set(
  coalesce(feature_flags, '{}'),
  '$.hackathons',
  json('true')
)
WHERE code = 'DZ';
