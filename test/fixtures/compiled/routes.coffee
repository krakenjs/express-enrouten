module.exports = (router) ->

    router.get '/', (req, res) ->
        res.send('ok')

    router.get '/coffee', (req, res) ->
        res.send('ok')
