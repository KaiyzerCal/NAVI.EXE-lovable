-- Enable realtime for party tables so live member/party updates fire
ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE party_members;
