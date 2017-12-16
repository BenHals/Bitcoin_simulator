var container = null;
var container_bounding = null;
var b_canvas = null;
var b_ctx = null
var f_canvas = null;
var f_ctx = null;

var coin_name = null;
var starting_price = null;
var current_price = null;
var starting_wallet = 1000;
var wallet_current = starting_wallet;
var coins_owned = 0;
var coins_value = 0;
var profit = 0;
var variance = 0.02;
var trend = 0.1;

var start_time = null;
var last_timestamp = null;
var pause = false;
var time_since_last_update = 0;
var update_wait = 1000;
var graph;

var returns_list = [];
var price_list = [];
var last_price = null;
var last_return = null;
var min_price = null;
var max_price = null;

function updator(timestamp){
    
    start_time = start_time == null ? timestamp : start_time;
    last_timestamp = last_timestamp == null ? timestamp : last_timestamp;
    var time_since_last_frame = timestamp - last_timestamp;
    time_since_last_update += time_since_last_frame;
    var p = time_since_last_update / update_wait;
    if(time_since_last_update > update_wait){
        time_since_last_update = 0;
        var return_value = d3.randomNormal(trend, variance)();
        var new_price_value = Math.exp(Math.log(last_price) + return_value);

        coins_value = coins_owned * new_price_value;
        profit = (wallet_current + coins_value) - starting_wallet;

        variance = Math.abs(d3.randomNormal(0, Math.random() * 0.1)());

        if(Math.random() < 0.2){
            trend = d3.randomNormal(0, Math.random() * 0.2)();
        }

        console.log("t" + trend);
        console.log("v" + variance);
        var old_price = last_price;
        last_return = return_value;
        last_price = new_price_value;
    
        returns_list.push(last_return);
        price_list.push(last_price);

        var new_min = Math.min(...price_list, 0);
        var new_max = Math.max(...price_list, 0);
        text_update();
        update_price_graph(graph, last_price, old_price, new_max, new_min, min_price, max_price );
        min_price = new_min;
        max_price = new_max;
    }
    var p = time_since_last_update / update_wait;
    b_ctx.clearRect(0,0, container_bounding.width, container_bounding.height);
    draw_graph(b_ctx, graph, p);
    last_timestamp = timestamp;
    requestAnimationFrame(updator);
}

function text_update(){
    var display_string = `Price: ${Math.round(last_price * 100) / 100} \nWallet: ${wallet_current} \nCoins: ${coins_owned} with value: ${coins_value} `;
    $("#price").text(`$${Math.round(last_price * 100) / 100}`);
    $("#wallet").text(`Wallet: ${Math.round(wallet_current * 100) / 100}`);
    $("#coins").text(`Coins: ${Math.round(coins_owned * 100) / 100}`);
    $("#value").text(`Profit: ${Math.round(profit * 100) / 100}`);
}

window.onload = function(){
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

    coin_name = coin_name_gen();
    console.log(coin_name);
    $("#main_title").text(coin_name);

    starting_price = Math.random() * wallet_current;

    last_return = 1;
    last_price = starting_price;

    returns_list.push(last_return);
    price_list.push(last_price);
    text_update();

    var bounds = $("#graph")[0].getBoundingClientRect();
    graph = create_price_graph(100, bounds, starting_price);
    update_price_graph(graph, last_price, 0, last_price, 0);
    //draw_graph(f_ctx, graph, 0);

    requestAnimationFrame(updator);
};

function buy(amount){
    var transaction_price = amount * last_price;
    if(transaction_price <= wallet_current){
        wallet_current -= transaction_price;
        coins_owned += amount;
        text_update();
    }else{
        $('#wallet').addClass('bad-input');
        $('#wallet').one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        function (e) {
            $('#wallet').removeClass('bad-input');
        });

        
    }
}

function sell(amount){
    var transaction_price = amount * last_price;
    if(amount <= coins_owned){
        wallet_current += transaction_price;
        coins_owned -= amount;
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

    return name.join('');
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
        nodes.push([{x:[sum, sum+ node_length, null], 
            y:[bounds.bottom - 0.5 * bounds.height, bounds.bottom - 0.5 * bounds.height, null, starting_price]}, 
            {x:[sum + node_length,  sum + node_length * 2, null], 
                y:[bounds.bottom - 0.5 * bounds.height, bounds.bottom - 0.5 * bounds.height, null, starting_price]}]);
        sum += node_length;
    }
    return {nodes:nodes, length:node_length, bounds:bounds, last_node:0};
}

function update_price_graph(graph, new_price, last_price, max_price, min_price, last_min, last_max){
    var bounds = graph.bounds;
    // var last_node = graph.nodes[graph.last_node];
    // var connecting_node_index = (graph.last_node + (graph.nodes.length - 1)) % graph.nodes.length;
    // last_node[0].x[0] = bounds.right;
    // last_node[0].x[1] = bounds.right - graph.length;
    // last_node[0].x[2] = d3.interpolate(bounds.right, bounds.right - graph.length);
    // last_node[0].y[0] = graph.nodes[connecting_node_index][1].y[1];
    // last_node[0].y[1] = bounds.bottom - ((last_price - min_price) / (max_price - min_price)) * bounds.height;
    // last_node[0].y[2] = d3.interpolate(last_node[0].y[0], last_node[0].y[1]);

    // last_node[1].x[0] = bounds.right + graph.length;
    // last_node[1].x[1] = bounds.right;
    // last_node[1].x[2] = d3.interpolate(last_node[0].x[0], last_node[0].x[1]);
    // last_node[1].y[0] = bounds.bottom - ((new_price - min_price) / (max_price - min_price)) * bounds.height;
    // last_node[1].y[1] = bounds.bottom - ((new_price - min_price) / (max_price - min_price)) * bounds.height;
    for(var n = 0; n < graph.nodes.length; n++){
        var node = graph.nodes[n];
        var initial_x1 = node[0].x[1];
        var initial_x2 = node[1].x[1];
        var end_x1 = initial_x1 - graph.length;
        var end_x2 = initial_x2 - graph.length;
        if(initial_x2 <= graph.bounds.left){
            // I.E it has reached the left hand side
            initial_x1 = bounds.right;
            initial_x2 = bounds.right + graph.length;
            end_x1 = initial_x1 - graph.length;
            end_x2 = initial_x2 - graph.length;
            node[0].y[3] = last_price;
            node[1].y[3] = new_price;

            var connecting_node_index = (n + (graph.nodes.length - 1)) % graph.nodes.length;
            node[0].y[1] = bounds.bottom - ((last_price - last_min) / (last_max - last_min)) * bounds.height;
            node[1].y[1] = bounds.bottom - ((new_price - min_price) / (max_price - min_price)) * bounds.height;

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
}

function draw_graph(ctx, graph, p){
    for(var n = 0; n < graph.nodes.length; n++){
        var node = graph.nodes[n];
        ctx.beginPath();
        ctx.moveTo(Math.min(Math.max(node[0].x[2](p), graph.bounds.left), graph.bounds.right), node[0].y[2](p));
        ctx.lineTo(Math.min(Math.max(node[1].x[2](p), graph.bounds.left), graph.bounds.right), node[1].y[2](p));
        ctx.closePath();
        ctx.stroke();
    }

}