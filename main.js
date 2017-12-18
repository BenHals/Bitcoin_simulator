var container = null;
var container_bounding = null;
var b_canvas = null;
var b_ctx = null
var f_canvas = null;
var f_ctx = null;

var num_nodes = 100;

var coin_log = [];
var selected_coin_name = null;
// var coin_name = null;
// var starting_price = null;
// var current_price = null;
var starting_wallet = 1000;
var wallet_current = starting_wallet;
// var coins_owned = 0;
// var coins_value = 0;
var profit = 0;
// var variance = 0.02;
// var trend = 0.1;

var start_time = null;
var last_timestamp = null;
var pause = false;
var time_since_last_update = 0;
var update_wait = 1000;
var graph;

// var returns_list = [];
// var price_list = [];
// var last_price = null;
// var last_return = null;
// var min_price = null;
// var max_price = null;
// var up = null;

function updator(timestamp){
    
    start_time = start_time == null ? timestamp : start_time;
    last_timestamp = last_timestamp == null ? timestamp : last_timestamp;
    var time_since_last_frame = timestamp - last_timestamp;
    time_since_last_update += time_since_last_frame;
    var p = time_since_last_update / update_wait;
    if(time_since_last_update > update_wait){
        time_since_last_update = 0;
        var profit_calc = (wallet_current - starting_wallet);
        var coin_names = Object.keys(coin_log);
        for(var c = 0; c < coin_names.length; c++){
            var coin_name = coin_names[c];
            var coin = coin_log[coin_name];

            var return_value = d3.randomNormal(coin.trend, coin.variance)();
            var new_price_value = Math.exp(Math.log(coin.last_price) + return_value);
    
            coin.value = coin.owned * new_price_value;
            profit_calc += coin.value;
    
            coin.variance = Math.abs(d3.randomNormal(0, Math.random() * 0.1)());
    
            if(Math.random() < 0.2){
                coin.trend = d3.randomNormal(0, Math.random() * 0.2)();
            }
    
            console.log("t" + coin.trend);
            console.log("v" + coin.variance);
            coin.old_price = coin.last_price;
            coin.last_return = return_value;
            coin.last_price = new_price_value;
            coin.last_price >= coin.old_price ? coin.up = true : coin.up = false;;
            coin.returns_list.push(coin.last_return);
            coin.price_list.push(coin.last_price);
    
            var on_screen = coin.price_list.slice(Math.max(coin.price_list.length - num_nodes, 0), coin.price_list.length);
            coin.old_min_price = coin.min_price;
            coin.old_max_price = coin.max_price;
            coin.min_price = Math.min(...on_screen, 0);
            coin.max_price = Math.max(...on_screen, 0);
        }
        profit = profit_calc;
        coin = coin_log[selected_coin_name];
        text_update();
        update_price_graph(graph, coin);

    }
    var p = time_since_last_update / update_wait;
    b_ctx.clearRect(0,0, container_bounding.width, container_bounding.height);
    draw_graph(b_ctx, graph, p);
    last_timestamp = timestamp;
    requestAnimationFrame(updator);
}

function text_update(){
    var coin = coin_log[selected_coin_name];
    $("#main_title").text(selected_coin_name);
    var display_string = `Price: ${Math.round(coin.last_price * 100) / 100} \nWallet: ${wallet_current} \nCoins: ${coin.owned} with value: ${coin.value} `;
    $("#price").text(`$${Math.round(coin.last_price * 100) / 100}`);
    $("#price").css({color: coin.up ? "green" : "red"});
    $("#wallet").text(`Cash: ${Math.round(wallet_current * 100) / 100}`);
    $("#coins").text(`Coins: ${Math.round(coin.owned * 100) / 100}`);
    $("#value").text(`Profit: ${Math.round(profit * 100) / 100}`);
    
}

window.onload = function(){
    document.onkeypress = function(e){
		e =e || window.event;
		if(e.keyCode == 32) selected_coin_name = Object.keys(coin_log)[Math.floor(Math.random() * Object.keys(coin_log).length)];
	}
    container = document.getElementById("main_display");
    container_bounding = this.container.getBoundingClientRect();
     
    b_canvas = document.createElement("canvas");
    b_canvas.setAttribute("id","background-canvas");
    b_canvas.setAttribute("width", this.container_bounding.width);
    b_canvas.setAttribute("height", this.container_bounding.height);
    b_canvas.style.position = "absolute";
    b_ctx = b_canvas.getContext("2d");

    f_canvas = document.createElement("canvas");
    f_canvas.setAttribute("id","foreground-canvas");
    f_canvas.setAttribute("width", this.container_bounding.width);
    f_canvas.setAttribute("height", this.container_bounding.height);
    f_canvas.style.position = "absolute";
    this.f_ctx = f_canvas.getContext("2d");

    this.container.prepend(b_canvas);
    this.container.appendChild(f_canvas);
    new_coin();
    new_coin();
    selected_coin_name = new_coin();
    text_update();
    var coin = coin_log[selected_coin_name];
    var bounds = $("#graph")[0].getBoundingClientRect();
    graph = create_price_graph(num_nodes, bounds, coin.last_price);
    update_price_graph(graph, coin);
    //draw_graph(f_ctx, graph, 0);

    requestAnimationFrame(updator);
};

function new_coin(){
    var name_gen = coin_name_gen();
    var coin = {};
    coin.name = name_gen[0];
    coin.ticker = name_gen[1];
    console.log(coin.name);

    coin.starting_price = Math.random() * (wallet_current/2);
    coin.trend = 0;
    coin.variance = 0.01;
    coin.last_return = 1;
    coin.last_price = coin.starting_price;
    coin.up = coin.last_return >= 1 ? true : false;
    coin.returns_list = [];
    coin.price_list = [];
    coin.returns_list.push(coin.last_return);
    coin.price_list.push(coin.last_price);
    coin.owned = 0;
    coin.value = coin.owned * coin.last_price;
    coin_log[coin.name] = coin;
    return coin.name;
}

function buy(amount, coin_name){
    if(!amount){
        var input = $("#buy_amount");
        amount = parseFloat(input.val());
    }
    coin_name = coin_name ? coin_name : selected_coin_name;
    var coin = coin_log[coin_name];
    var transaction_price = amount * coin.last_price;
    if(transaction_price <= wallet_current){
        wallet_current -= transaction_price;
        coin.owned += amount;
        text_update();

    }else{
        $('#wallet').addClass('bad-input');
        $('#wallet').one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        function (e) {
            $('#wallet').removeClass('bad-input');
        });

        
    }
}

function sell(amount, coin_name){
    if(!amount){
        var input = $("#sell_amount");
        amount = parseFloat(input.val());
    }
    coin_name = coin_name ? coin_name : selected_coin_name;
    var coin = coin_log[coin_name];
    var transaction_price = amount * coin.last_price;
    if(amount <= coin.owned){
        wallet_current += transaction_price;
        coin.owned -= amount;
        text_update();
    }else{
        $('#coins').addClass('bad-input');
        $('#coins').one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        function (e) {
            $('#coins').removeClass('bad-input');
        });
    }
}

function coin_name_gen(){
    var word_lists = [nouns_list, adjectives_list];
    var list_chances = [0.5, 1];
    var mid_extra_chance = 0.05;
    var end_extra_chance = 0.1;
    var extra_word_chance = 0.05;
    var name = [];
    var extra_word_roll = 0;
    while(extra_word_roll < extra_word_chance){
        var add_word_type = Math.random();
        var index = 0;
        for(var l = 0; l < word_lists.length; l++){
            if (add_word_type < list_chances[l]) break;
            index++;
        }
        var list = word_lists[index];
        name.push(word_from_list(list));
        
        extra_word_roll = Math.random();
    }
    var mid_roll = Math.random();
    if(mid_roll < mid_extra_chance) name.push(word_from_list(coin_extras_list) + " ");

    name.push(word_from_list(coin_ends_list));

    var end_roll = Math.random();
    if(mid_roll >= mid_extra_chance && end_roll < end_extra_chance) name.push(" " + word_from_list(coin_extras_list));

    var name_string = name.join('');
    var ticker = name.reduce((a, c) => a+c.slice(0,1), '');
    return [name_string, ticker];
}

function word_from_list(list){
    var word_index = Math.floor(Math.random()*list.length);
    var word = list[word_index];
    return ucFirst(word);
}

function ucFirst(string) 
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function create_price_graph(num_nodes, bounds, starting_price){
    var nodes = [];
    var node_length = bounds.width / (num_nodes - 1);
    var sum = bounds.left;
    for(var n = 0; n < num_nodes; n++){
        nodes.push([{x:[sum, sum- node_length, null], 
            y:[bounds.bottom - 0.5 * bounds.height, bounds.bottom - 0.5 * bounds.height, null, starting_price]}, 
            {x:[sum + node_length,  sum, null], 
                y:[bounds.bottom - 0.5 * bounds.height, bounds.bottom - 0.5 * bounds.height, null, starting_price]}]);
        sum += node_length;
    }
    var price_node_map = [];
    for(var i = 0; i < num_nodes; i++){
        price_node_map.push(i);
    }
    return {nodes:nodes, length:node_length, bounds:bounds, last_node:0, price_node_map:price_node_map, reset_index:0};
}

function update_price_graph(graph, coin){
    var new_price = coin.last_price ? coin.last_price : 0;
    var last_price = coin.old_price ? coin.old_price : 0;
    var max_price = coin.max_price ? coin.max_price : coin.starting_price;
    var min_price = coin.min_price ? coin.min_price : 0;
    var last_max = coin.old_max_price ? coin.old_max_price : coin.starting_price;
    var last_min = coin.old_min_price ? coin.old_min_price : 0;
    var bounds = graph.bounds;
    var onscreen_prices = coin.price_list.slice(Math.max(coin.price_list.length - num_nodes - 1, 0), coin.price_list.length);
    onscreen_prices = Array(num_nodes - onscreen_prices.length + 1).fill(coin.starting_price).concat(onscreen_prices);
    graph.price_node_map.unshift(graph.price_node_map.pop());
    for(var n = 0; n < graph.nodes.length; n++){
        var node = graph.nodes[n];
        var initial_x1 = node[0].x[1];
        var initial_x2 = node[1].x[1];
        var end_x1 = initial_x1 - graph.length;
        var end_x2 = initial_x2 - graph.length;

        if(n == graph.reset_index){
            
            // I.E it has reached the left hand side
            initial_x1 = graph.bounds.right - graph.length;
            initial_x2 = graph.bounds.right;
            end_x1 = initial_x1 - graph.length;
            end_x2 = initial_x2 - graph.length;
            var price = onscreen_prices[graph.price_node_map[n] + 1];
            var last_price_val = onscreen_prices[graph.price_node_map[n]];
            node[0].y[3] = last_price_val;
            node[1].y[3] = price;

            var connecting_node_index = (n + (graph.nodes.length - 1)) % graph.nodes.length;
            node[0].y[1] = bounds.bottom - ((node[0].y[3] - last_min) / (last_max - last_min)) * bounds.height;
            node[1].y[1] = bounds.bottom - ((node[1].y[3] - min_price) / (max_price - min_price)) * bounds.height;
            
        }else{
            var price = onscreen_prices[graph.price_node_map[n] + 1];
            var last_price_val = onscreen_prices[graph.price_node_map[n]];
            node[0].y[3] = last_price_val;
            node[1].y[3] = price;
        }
        
        var initial_y1 = node[0].y[1];
        var initial_y2 = node[1].y[1];
        var end_y1 = bounds.bottom - ((node[0].y[3] - min_price) / (max_price - min_price)) * bounds.height;
        var end_y2 = bounds.bottom - ((node[1].y[3] - min_price) / (max_price - min_price)) * bounds.height;

        node[0].x[0] = initial_x1;
        node[0].x[1] = end_x1;
        node[0].x[2] = d3.interpolate(initial_x1, end_x1);
        node[0].y[0] = initial_y1;
        node[0].y[1] = end_y1;
        node[0].y[2] = d3.interpolate(initial_y1, end_y1);

        node[1].x[0] = initial_x2;
        node[1].x[1] = end_x2;
        node[1].x[2] = d3.interpolate(initial_x2, end_x2);
        node[1].y[0] = initial_y2;
        node[1].y[1] = end_y2;
        node[1].y[2] = d3.interpolate(initial_y2, end_y2);
    }
    graph.reset_index = (graph.reset_index + 1) % graph.nodes.length;
}

function draw_graph(ctx, graph, p){
    for(var n = 0; n < graph.nodes.length; n++){
        var node = graph.nodes[n];
        ctx.beginPath();
        ctx.moveTo(Math.min(Math.max(node[0].x[2](p), graph.bounds.left), graph.bounds.right), node[0].y[2](p));
        ctx.lineTo(Math.max(node[1].x[2](p), graph.bounds.left), node[1].y[2](p));
        ctx.closePath();
        ctx.stroke();
    }

}