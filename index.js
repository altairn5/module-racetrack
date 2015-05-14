module.exports = {
	game_constructor: __dirname + '/race',
	public_dir: __dirname + '/public',
//	game_server_constructor: null, 	// default
	io_exposed_methods: ['turn_intended', 'player_connected', 'start_game', 'create_game']	
}